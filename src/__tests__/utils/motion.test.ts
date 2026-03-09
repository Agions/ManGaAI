/**
 * 动效工具测试
 */

import {
  transitions,
  easings,
  pageVariants,
  fadeInVariants,
  slideUpVariants,
  scaleInVariants,
  listItemVariants,
  cardHoverVariants,
  buttonTapVariants,
  skeletonVariants,
  createPageTransition,
  createStaggerChildren
} from '@/core/utils/motion';

describe('motion utils', () => {
  describe('transitions', () => {
    it('should have fast transition', () => {
      expect(transitions.fast).toEqual({ duration: 0.15 });
    });

    it('should have normal transition', () => {
      expect(transitions.normal).toEqual({ duration: 0.25 });
    });

    it('should have slow transition', () => {
      expect(transitions.slow).toEqual({ duration: 0.35 });
    });
  });

  describe('easings', () => {
    it('should have standard easing', () => {
      expect(easings.standard).toEqual([0.4, 0, 0.2, 1]);
    });

    it('should have decelerate easing', () => {
      expect(easings.decelerate).toEqual([0, 0, 0.2, 1]);
    });

    it('should have accelerate easing', () => {
      expect(easings.accelerate).toEqual([0.4, 0, 1, 1]);
    });
  });

  describe('pageVariants', () => {
    it('should have initial state', () => {
      expect(pageVariants.initial).toEqual({ opacity: 0, y: 20 });
    });

    it('should have animate state', () => {
      expect(pageVariants.animate).toHaveProperty('opacity', 1);
      expect(pageVariants.animate).toHaveProperty('y', 0);
    });

    it('should have exit state', () => {
      expect(pageVariants.exit).toHaveProperty('opacity', 0);
      expect(pageVariants.exit).toHaveProperty('y', -20);
    });
  });

  describe('fadeInVariants', () => {
    it('should fade in from opacity 0', () => {
      expect(fadeInVariants.initial).toEqual({ opacity: 0 });
      expect(fadeInVariants.animate).toEqual({ opacity: 1 });
    });
  });

  describe('slideUpVariants', () => {
    it('should slide up from y: 20', () => {
      expect(slideUpVariants.initial).toEqual({ opacity: 0, y: 20 });
      expect(slideUpVariants.animate).toEqual({ opacity: 1, y: 0 });
    });
  });

  describe('scaleInVariants', () => {
    it('should scale from 0.95', () => {
      expect(scaleInVariants.initial).toEqual({ opacity: 0, scale: 0.95 });
      expect(scaleInVariants.animate).toEqual({ opacity: 1, scale: 1 });
    });
  });

  describe('listItemVariants', () => {
    it('should accept index for staggered delay', () => {
      // Type assert to handle the callable Variant type
      const animateFn = listItemVariants.animate as (i: number) => { opacity: number; y: number; transition: unknown };
      const variant = animateFn(5);
      expect(variant).toHaveProperty('opacity', 1);
      expect(variant).toHaveProperty('y', 0);
      expect(variant).toHaveProperty('transition');
    });
  });

  describe('cardHoverVariants', () => {
    it('should have rest state', () => {
      expect(cardHoverVariants.rest).toHaveProperty('y', 0);
    });

    it('should have hover state with transform', () => {
      expect(cardHoverVariants.hover).toHaveProperty('y', -5);
    });
  });

  describe('buttonTapVariants', () => {
    it('should have tap state', () => {
      expect(buttonTapVariants.tap).toEqual({ scale: 0.98 });
    });
  });

  describe('skeletonVariants', () => {
    it('should have animation', () => {
      expect(skeletonVariants.initial).toEqual({ opacity: 0.5 });
      expect(skeletonVariants.animate).toHaveProperty('transition');
    });
  });

  describe('createPageTransition', () => {
    it('should create custom page transition', () => {
      const custom = createPageTransition({ duration: 0.5 });
      expect(custom.animate.transition).toHaveProperty('duration', 0.5);
    });
  });

  describe('createStaggerChildren', () => {
    it('should create stagger config', () => {
      const stagger = createStaggerChildren(0.1);
      expect(stagger).toHaveProperty('animate');
      expect(stagger.animate.transition).toHaveProperty('staggerChildren', 0.1);
    });
  });
});
