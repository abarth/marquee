// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

(function(global) {

// According to MDN, we're supposed to dispatch |start|, |finish|, and |bounce|
// events at various points in the marquee's lifecycle, but Blink doesn't
// appear to dispatch those events.

var kDefaultScrollAmount = 6;
var kDefaultScrollDelayMS = 85;
var kMinimumScrollDelayMS = 60;

var kDefaultLoopLimit = -1;

var kBehaviorScroll = 'scroll';
var kBehaviorSlide = 'slide';
var kBehaviorAlternate = 'alternate';

var kDirectionLeft = 'left';
var kDirectionRight = 'right';
var kDirectionUp = 'up';
var kDirectionDown = 'down';

var HTMLMarqueeElementPrototype = Object.create(HTMLElement.prototype);

HTMLMarqueeElementPrototype.createdCallback = function() {
    var shadow = this.createShadowRoot();
    var style = global.document.createElement('style');
    style.textContent = ':host { display: inline-block; width: -webkit-fill-available; overflow: hidden }' +
                        ':host([direction="up"]), :host([direction="down"]) { height: 200px; }';
    shadow.appendChild(style);

    var mover = global.document.createElement('div');
    mover.setAttribute('style', 'display: inline-block;');
    shadow.appendChild(mover);

    var content = global.document.createElement('content');
    mover.appendChild(content);

    this.running_ = false;
    this.loopCount_ = 0;
    this.mover_ = mover;
    this.player_ = null;
    this.continueCallback_ = null;
};

HTMLMarqueeElementPrototype.attachedCallback = function() {
    this.start();
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

    var moverWidth = parseInt(moverStyle.width);
    var moverHeight = parseInt(moverStyle.height);
    var marqueeWidth = parseInt(marqueeStyle.width);
    var marqueeHeight = parseInt(marqueeStyle.height);

    var totalWidth = marqueeWidth + moverWidth;
    var totalHeight = marqueeHeight + moverHeight;

    var innerWidth = marqueeWidth - moverWidth;
    var innerHeight = marqueeHeight - moverHeight;

    var behavior = this.getAttribute('behavior');
    var direction = this.getAttribute('direction');

    var parameters = {};

    switch (behavior) {
    case kBehaviorScroll:
    default:
        switch (direction) {
        case kDirectionLeft:
        default:
            parameters.transformBegin = 'translateX(' + marqueeWidth + 'px)';
            parameters.transformEnd = 'translateX(-100%)';
            parameters.distance = totalWidth;
            break;
        case kDirectionRight:
            parameters.transformBegin = 'translateX(-100%)';
            parameters.transformEnd = 'translateX(' + marqueeWidth + 'px)';
            parameters.distance = totalWidth;
            break;
        case kDirectionUp:
            parameters.transformBegin = 'translateY(' + marqueeHeight + 'px)';
            parameters.transformEnd = 'translateY(-100%)';
            parameters.distance = totalHeight;
            break;
        case kDirectionDown:
            parameters.transformBegin = 'translateY(-100%)';
            parameters.transformEnd = 'translateY(' + marqueeHeight + 'px)';
            parameters.distance = totalHeight;
            break;
        }
        break;
    case kBehaviorAlternate:
        switch (direction) {
        case kDirectionLeft:
        default:
            parameters.transformBegin = 'translateX(' + innerWidth + 'px)';
            parameters.transformEnd = 'translateX(0)';
            parameters.distance = innerWidth;
            break;
        case kDirectionRight:
            parameters.transformBegin = 'translateX(0)';
            parameters.transformEnd = 'translateX(' + innerWidth + 'px)';
            parameters.distance = innerWidth;
            break;
        case kDirectionUp:
            parameters.transformBegin = 'translateY(' + innerHeight + 'px)';
            parameters.transformEnd = 'translateY(0)';
            parameters.distance = innerHeight;
            break;
        case kDirectionDown:
            parameters.transformBegin = 'translateY(0)';
            parameters.transformEnd = 'translateY(' + innerHeight + 'px)';
            parameters.distance = innerHeight;
            break;
        }

        if (this.loopCount_ % 2) {
            var transform = parameters.transformBegin;
            parameters.transformBegin = parameters.transformEnd;
            parameters.transformEnd = transform;
        }

        break;
    case kBehaviorSlide:
        switch (direction) {
        case kDirectionLeft:
        default:
            parameters.transformBegin = 'translateX(' + marqueeWidth + 'px)';
            parameters.transformEnd = 'translateX(0)';
            parameters.distance = marqueeWidth;
            break;
        case kDirectionRight:
            parameters.transformBegin = 'translateX(-100%)';
            parameters.transformEnd = 'translateX(' + innerWidth + 'px)';
            parameters.distance = marqueeWidth;
            break;
        case kDirectionUp:
            parameters.transformBegin = 'translateY(' + marqueeHeight + 'px)';
            parameters.transformEnd = 'translateY(0)';
            parameters.distance = marqueeHeight;
            break;
        case kDirectionDown:
            parameters.transformBegin = 'translateY(-100%)';
            parameters.transformEnd = 'translateY(' + innerHeight + 'px)';
            parameters.distance = marqueeHeight;
            break;
        }
        break;
    }

    return parameters
};

HTMLMarqueeElementPrototype.animationDuration_ = function(distance) {
    var scrollAmount = this.getScrollAmount_();
    var scrollDelay = this.getScrollDelay_();
    return distance * scrollDelay / scrollAmount;
};

HTMLMarqueeElementPrototype.shouldContinue_ = function() {
    var value = this.getAttribute('loop');
    var loop = value === null ? kDefaultLoopLimit : parseInt(value);

    // By default, slide loops only once.
    if (loop <= 0 && this.getAttribute('behavior') === kBehaviorSlide)
        loop = 1;

    if (loop <= 0)
        return true;
    return this.loopCount_ < loop;
};

HTMLMarqueeElementPrototype.continue_ = function() {
    if (!this.shouldContinue_())
        return;

    this.mover_.style.transform = null;
    var parameters = this.getAnimationParmeters_();

    this.player_ = this.mover_.animate([
        { transform: parameters.transformBegin },
        { transform: parameters.transformEnd },
    ], {
        duration: this.animationDuration_(parameters.distance),
        fill: 'forwards',
    });

    this.player_.addEventListener('finish', function() {
        if (!this.running_)
            return;
        ++this.loopCount_;
        this.continue_();
    }.bind(this));
};

HTMLMarqueeElementPrototype.start = function() {
    if (this.running_)
        return;
    this.running_ = true;;

    this.continueCallback_ = global.requestAnimationFrame(function() {
        this.continueCallback_ = null;
        this.continue_();
    }.bind(this));
};

HTMLMarqueeElementPrototype.stop = function() {
    if (!this.running_)
        return;
    this.running_ = false;

    if (this.continueCallback_)
        global.cancelAnimationFrame(this.continueCallback_);

    // TODO(abarth): Rather than canceling the animation and programming an
    // inline transform, we really should just pause the animation. However,
    // the pause function is still flagged as experimental.
    this.mover_.style.transform = global.getComputedStyle(this.mover_).transform;
    if (this.player_)
        this.player_.cancel();
};

global.document.registerElement('i-marquee', {
    prototype: HTMLMarqueeElementPrototype,
});

})(this);
