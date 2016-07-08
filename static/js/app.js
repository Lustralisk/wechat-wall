'use strict';

var offsets = [19, 19 + 19, 19 + 2 * 19, 19 + 3 * 19];
var animation_speed = 300;
var load_image = function(src, image) {
    image.src = '';
    var downloadImage = new Image();
    downloadImage.onload = function() {
        //image.attr('src', this.src);
        image.css('background-image', 'url(' + this.src + ')');
    }
    downloadImage.src = src;
}
var message_2_tag = function(msg) {
    var fake = $('<div style="opacity:0;position:absolute;font-size:8vh;">' + msg['content'] + '</div>');
    if (fake.appendTo($('body')).width() < $(window).innerWidth() * 0.56) {
        return "<div class='portrait'></div><div class='nickname'>" +
        msg['nickname'] + "</div><div class='message'>" + 
        msg['content'] + "</div>";
    }
    else {
        return "<div class='portrait'></div><div class='nickname'>" +
        msg['nickname'] + "</div><div class='message marquee'>" + 
        msg['content'] + "</div>";
    }
    fake.remove();
}
var admin_2_tag = function(msg) {
    var fake = $('<div style="opacity:0;position:absolute;font-size:8vh;">' + msg['content'] + '</div>');
    if (fake.appendTo($('body')).width() < $(window).innerWidth() * 0.56) {
        return "<div class='portrait-dec admin-dec'></div><div class='portrait admin-portrait'></div><div class='nickname'>" +
        msg['nickname'] + "</div><div class='message'>" + 
        msg['content'] + "</div>";
    }
    else {
        return "<div class='portrait-dec admin-dec'></div><div class='portrait admin-portrait'></div><div class='nickname'>" +
        msg['nickname'] + "</div><div class='message marquee'>" + 
        msg['content'] + "</div>";
    }
    fake.remove();
}
var cards = [];
for (var i = 0; i < 4; i++) {
    cards[i] = {
        id: i,
        content: 'content' + i,
        show: 0,
        admin: 0,
        offset: i,
    };
};
cards.admin = -1;
cards.timer = -1;
cards.start = function() {
    for (var i = 0; i < 4; i++) {
        if (this[i].offset == 0) {
            return i;
        }
    }
}
cards.next = function() {
    for (var i = 0; i < 4; i++) {
        if (this[i].offset == 3) {
            return i;
        }
    }
}
cards.get = function(i) {
    return $('.wall-card:nth-child(' + (2 + i) + ')');
}
for (var i = 0; i < 4; i++) {
    cards.get(i).css('top', offsets[i] + '%');
}
var move = function(obj, pre, now) {
    if (pre == now) {
        return;
    }
    if (pre == 0 && now == 3) {
        obj.animate({'opacity': 0}, animation_speed);
    }
    if (now == 0 && pre != 1) {
        obj
        .css('opacity', 0)
        .animate({'top': offsets[0] + '%'}, animation_speed / 2)
        .animate({'opacity': 1}, animation_speed / 2);
    }
    else {
        obj.animate({'top': offsets[now] + '%'}, animation_speed);
    }
}
cards.add = function(msg) {
    var next = this.next();
    this[next].show = 1;
    this.get(next).html(message_2_tag(msg));
    load_image(msg['headimgurl'], $(this.get(next).children()[0]));
    for (var i = 0; i < 4; i++) {
        if (this.admin == -1) {
            move(this.get(i), this[i].offset, (this[i].offset + 1) % 4);
            this[i].offset = (this[i].offset + 1) % 4;
        }
        else {
            move(this.get(i), this[i].offset, this[i].offset == 0 ? 0 : this[i].offset % 3 + 1);
            this[i].offset = this[i].offset == 0 ? 0 : this[i].offset % 3 + 1;
        }
        if (this[i].show == 1) {
            this.get(i).css('display', 'block');
        }
        else {
            this.get(i).css('display', 'none');
        }
    }
}
cards.add_admin = function(msg) {
    if (this.admin != -1) {
        this.get(this.admin).html(admin_2_tag(msg));
    }
    else {
        clearTimeout(this.timer);
        var next = this.next();
        this[next].show = 1;
        this.admin = next;
        this.get(this.admin).html(admin_2_tag(msg)).addClass('admin');
        for (var i = 0; i < 4; i++) {
            move(this.get(i), this[i].offset, (this[i].offset + 1) % 4);
            this[i].offset = (this[i].offset + 1) % 4;
            if (this[i].show == 1) {
                this.get(i).css('display', 'block');
            }
            else {
                this.get(i).css('display', 'none');
            }
        }
    }
    this.timer = setTimeout(this.remove_admin.bind(this), 10000);
}
cards.remove_admin = function() {
    if (this.admin == -1) {
        return;
    }
    this.get(this.admin).removeClass('admin');
    this[this.admin].show = 0;
    for (var i = 0; i < 4; i++) {
        move(this.get(i), this[i].offset, (this[i].offset + 3) % 4)
        this[i].offset = (this[i].offset + 3) % 4;
        if (this[i].show == 1) {
            this.get(i).css('display', 'block');
        }
        else {
            this.get(i).css('display', 'none');
        }
    }
    this.admin = -1;
}
angular.module('wall', [
    'wall.controllers'
    ]).
    config(['$interpolateProvider', function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[');
        $interpolateProvider.endSymbol(']]');
    }]);
angular.module('wall.controllers', []).
    controller('wallCtrl', ['$scope', function($scope) {
        $scope.cards = cards;
    }]);
var socket = io('https://wall.cgcgbcbc.com');
window.onload = function(){
    $.get('https://wall.cgcgbcbc.com/api/messages?num=4').then(function(data) {
        $('#pre-loading').css('display', 'none');
        cards.add(data[0]);
        setTimeout(function() {cards.add(data[1]), 
            setTimeout(function() {cards.add(data[2]), 
                setTimeout(function() {cards.add(data[3]), 300})}, 300)}, 300);
    });
};
socket.on('new message', function(data) {
    cards.add(data);
}).on('admin', function(data) {
    cards.add_admin(data);
});
