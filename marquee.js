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

    var moverWidth = parseInt(moverStyle.width);
    var moverHeight = parseInt(moverStyle.height);
    var marqueeWidth = parseInt(marqueeStyle.width);
    var marqueeHeight = parseInt(marqueeStyle.height);

    var totalWidth = marqueeWidth + moverWidth;
    var totalHeight = marqueeHeight + moverHeight;

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
            parameters.transformEnd = 'translateY(-' + moverHeight + 'px)';
            parameters.distance = totalHeight;
            break;
        case kDirectionDown:
            parameters.transformBegin = 'translateY(-' + moverHeight + 'px)';
            parameters.transformEnd = 'translateY(' + marqueeHeight + 'px)';
            parameters.distance = totalHeight;
            break;
        }
        break;
    case kBehaviorAlternate:
        var deltaX = marqueeWidth - moverWidth;
        var deltaY = marqueeHeight - moverHeight;

        switch (direction) {
        case kDirectionLeft:
        default:
            parameters.transformBegin = 'translateX(' + deltaX + 'px)';
            parameters.transformEnd = 'translateX(0)';
            parameters.distance = deltaX;
            break;
        case kDirectionRight:
            parameters.transformBegin = 'translateX(0)';
            parameters.transformEnd = 'translateX(' + deltaX + 'px)';
            parameters.distance = deltaX;
            break;
        case kDirectionUp:
            parameters.transformBegin = 'translateY(' + deltaY + 'px)';
            parameters.transformEnd = 'translateY(0)';
            parameters.distance = deltaY;
            break;
        case kDirectionDown:
            parameters.transformBegin = 'translateY(0)';
            parameters.transformEnd = 'translateY(' + deltaY + 'px)';
            parameters.distance = deltaY;
            break;
        }

        if (this.loopCount_ % 2) {
            var transform = parameters.transformBegin;
            parameters.transformBegin = parameters.transformEnd;
            parameters.transformEnd = transform;
        }

        break;
    case kBehaviorSlide:
        // TODO(abarth): Implement me.
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
