// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function(global) {

var kDefaultScrollAmount = 6;
var kDefaultScrollDelayMS = 85;
var kMinimumScrollDelayMS = 60;

var kBehaviorScroll = 'scroll';
var kBehaviorSlide = 'slide';
var kBehaviorAlternate = 'alternate';
var kBehaviorDefault = kBehaviorScroll;

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

HTMLMarqueeElementPrototype.parseScrollAmount_  = function(value) {
    return value === null ? kDefaultScrollAmount : parseInt(value)
};

HTMLMarqueeElementPrototype.parseScrollDelay_  = function(value) {
    if (value === null)
        return kDefaultScrollDelayMS;
    var specifiedScrollDelay = parseInt(value);
    if (specifiedScrollDelay < kMinimumScrollDelayMS && !this.hasAttribute('truespeed'))
        return kDefaultScrollDelayMS;
    return specifiedScrollDelay;
};

HTMLMarqueeElementPrototype.animationDuration_ = function(distance) {
    var scrollAmount = this.parseScrollAmount_(this.getAttribute('scrollamount'));
    var scrollDelay = this.parseScrollDelay_(this.getAttribute('scrolldelay'));
    return distance * scrollDelay / scrollAmount;
};

HTMLMarqueeElementPrototype.start_ = function() {
    var marqueeWidth = parseInt(global.getComputedStyle(this).width);
    var moverWidth = parseInt(global.getComputedStyle(this.mover_).width);

    this.player_ = this.mover_.animate([{
        transform: 'translateX(' + marqueeWidth + 'px)',
    }, {
        transform: 'translateX(-100%)',
    }], this.animationDuration_(marqueeWidth + moverWidth));

    var self = this;
    this.player_.addEventListener('finish', function() {
        self.start_();
    });
};

global.document.registerElement('i-marquee', {
    prototype: HTMLMarqueeElementPrototype,
});

})(this);
