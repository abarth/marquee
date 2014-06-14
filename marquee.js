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

var kDirectionLeft = 'left';
var kDirectionRight = 'right';
var kDirectionUp = 'up';
var kDirectionDown = 'down';
var kDirectionDefault = kDirectionLeft;

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

    this.loopCount_ = 0;
    this.mover_ = mover;
    this.player_ = null;
};

HTMLMarqueeElementPrototype.attachedCallback = function() {
    var self = this;
    global.requestAnimationFrame(function() {
        self.start_();
    });
};

HTMLMarqueeElementPrototype.getScrollAmount_  = function() {
    var value = this.getAttribute('scrollamount');
    return value === null ? kDefaultScrollAmount : parseInt(value)
};

HTMLMarqueeElementPrototype.getScrollDelay_  = function() {
    var value = this.getAttribute('scrolldelay');
    if (value === null)
        return kDefaultScrollDelayMS;
    var specifiedScrollDelay = parseInt(value);
    if (specifiedScrollDelay < kMinimumScrollDelayMS && !this.hasAttribute('truespeed'))
        return kDefaultScrollDelayMS;
    return specifiedScrollDelay;
};

HTMLMarqueeElementPrototype.getAnimationParmeters_ = function() {
    var moverStyle = global.getComputedStyle(this.mover_);
    var marqueeStyle = global.getComputedStyle(this);

    var parameters = {};

    parameters.moverWidth = parseInt(moverStyle.width);
    parameters.moverHeight = parseInt(moverStyle.height);
    parameters.marqueeWidth = parseInt(marqueeStyle.width);
    parameters.marqueeHeight = parseInt(marqueeStyle.height);

    switch (this.getAttribute('direction')) {
    case kDirectionLeft:
    default:
        parameters.transformBegin = 'translateX(' + parameters.marqueeWidth + 'px)';
        parameters.transformEnd = 'translateX(-100%)';
        parameters.distance = parameters.marqueeWidth + parameters.moverWidth;
        break;
    case kDirectionRight:
        parameters.transformBegin = 'translateX(-100%)';
        parameters.transformEnd = 'translateX(' + parameters.marqueeWidth + 'px)';
        parameters.distance = parameters.marqueeWidth + parameters.moverWidth;
        break;
    case kDirectionUp:
        parameters.transformBegin = 'translateY(' + parameters.marqueeHeight + 'px)';
        parameters.transformEnd = 'translateY(-100%)';
        parameters.distance = parameters.marqueeHeight + parameters.moverHeight;
        break;
    case kDirectionDown:
        parameters.transformBegin = 'translateY(-100%)';
        parameters.transformEnd = 'translateY(' + parameters.marqueeHeight + 'px)';
        parameters.distance = parameters.marqueeHeight + parameters.moverHeight;
        break;
    }

    return parameters
};

HTMLMarqueeElementPrototype.animationDuration_ = function(distance) {
    var scrollAmount = this.getScrollAmount_();
    var scrollDelay = this.getScrollDelay_();
    return distance * scrollDelay / scrollAmount;
};

HTMLMarqueeElementPrototype.didExceedLoopLimit_ = function() {
    var loopValue = this.getAttribute('loop');
    if (loopValue == 'infinite')
        return false;
    var loopLimit = parseInt(loopValue);
    if (loopLimit == -1)
        return false;
    return this.loopCount_ >= loopLimit;
};

HTMLMarqueeElementPrototype.start_ = function() {
    if (this.didExceedLoopLimit_())
        return;

    var parameters = this.getAnimationParmeters_();

    this.player_ = this.mover_.animate([
        { transform: parameters.transformBegin },
        { transform: parameters.transformEnd },
    ], {
        duration: this.animationDuration_(parameters.distance),
        fill: 'forwards',
    });

    var self = this;
    this.player_.addEventListener('finish', function() {
        ++self.loopCount_;
        self.start_();
    });
};

global.document.registerElement('i-marquee', {
    prototype: HTMLMarqueeElementPrototype,
});

})(this);
