// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function(global) {

var HTMLMarqueeElementPrototype = Object.create(HTMLElement.prototype);

HTMLMarqueeElementPrototype.createdCallback = function() {
    var shadow = this.createShadowRoot();
    var style = global.document.createElement('style');
    style.textContent = ':host { display: inline-block; width: -webkit-fill-available; }';
    shadow.appendChild(style);

    var container = global.document.createElement('div');
    container.setAttribute('style', 'overflow: hidden;');
    shadow.appendChild(container);

    var mover = global.document.createElement('div');
    mover.setAttribute('style', 'display: inline-block;');
    container.appendChild(mover);

    var content = global.document.createElement('content');
    mover.appendChild(content);

    this.content_ = content;
    this.mover_ = mover;
    this.player_ = null;
};

HTMLMarqueeElementPrototype.attachedCallback = function() {
    var self = this;
    global.requestAnimationFrame(function() {
        self.start_();
    });
};

HTMLMarqueeElementPrototype.start_ = function() {
    var width = global.getComputedStyle(this).width;

    this.player_ = this.mover_.animate([{
        transform: 'translateX(' + width + ')',
    }, {
        transform: 'translateX(-100%)',
    }], 15000)

    var self = this;
    this.player_.addEventListener('finish', function() {
        self.start_();
    });
};

global.document.registerElement('i-marquee', {
    prototype: HTMLMarqueeElementPrototype,
});

})(this);
