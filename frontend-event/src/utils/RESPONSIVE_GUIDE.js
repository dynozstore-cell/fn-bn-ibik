/** RESPONSIVE DESIGN BREAKDOWN - EventsPage.jsx */

/**
 * BREAKPOINTS:
 * - Desktop (1024px+): Full 4-column grid, large cards, hover effects
 * - Tablet (768px-1023px): 3-column grid, medium cards, adjusted spacing
 * - Mobile (480px-767px): Single column, small cards, optimized spacing
 * - Small Mobile (320px-479px): Extra small cards, minimal padding
 * 
 * KEY RESPONSIVE FEATURES:
 */

// 1. GRID LAYOUT
/**
   Desktop (1024px+):   repeat(auto-fill, minmax(320px, 1fr))
   Tablet (768-1023):   repeat(auto-fill, minmax(250px, 1fr))
   Mobile (480-767):    1 column, full width
   Small (320-479):     1 column, full width
*/

// 2. CARD SIZING
/**
   Header Height:
   - Desktop: 200px
   - Tablet:  160px
   - Mobile:  140px
   - Small:   140px
   
   Title Size:
   - Desktop: 1.1rem
   - Tablet:  0.95rem
   - Mobile:  0.9rem
   - Small:   0.85rem
   
   Description Lines:
   - Desktop: 2 lines
   - Tablet:  1 line
   - Mobile:  1 line
   - Small:   1 line
*/

// 3. HERO SECTION
/**
   Title:
   - Desktop: 2.5rem
   - Tablet:  1.8rem
   - Mobile:  1.3rem
   - Small:   1.15rem
   
   Padding:
   - Desktop: 60px 20px
   - Tablet:  40px 20px
   - Mobile:  30px 16px
   - Small:   20px 12px
*/

// 4. SEARCH & FILTERS
/**
   Search Bar:
   - Desktop: Full width with padding 0 16px
   - Mobile:  Full width with padding 0 10px
   - Small:   Full width with padding 0 8px
   
   Filter Tabs:
   - Desktop: Flex wrap, centered
   - Tablet:  Flex wrap, centered
   - Mobile:  Horizontal scroll (no wrap)
   - Small:   Horizontal scroll (no wrap)
*/

// 5. BUTTONS
/**
   Padding & Font:
   - Desktop: 10px 16px, 0.9rem
   - Mobile:  8px 12px, 0.8rem
   - Small:   7px 10px, 0.75rem
   
   Actions:
   - Desktop: 2 buttons side by side (Beli Tiket + Bagikan)
   - Mobile:  2 buttons side by side (smaller)
   - Small:   2 buttons side by side (very small)
*/

// 6. SPACING & GAPS
/**
   Card Grid Gap:
   - Desktop: 24px
   - Tablet:  16px
   - Mobile:  12px
   - Small:   12px
   
   Card Padding:
   - Desktop: 20px
   - Mobile:  16px
   - Small:   12px
*/

// 7. HOVER EFFECTS
/**
   Desktop:
   - Card hover: translateY(-4px), shadow expansion
   - Button hover: scale + shadow
   
   Mobile:
   - Card hover: translateY(-2px) [reduced motion]
   - Button hover: translateY(-1px) [minimal]
   - No box-shadow expansion on mobile (better perf)
*/

// 8. SCROLLBAR (Mobile Filter Tabs)
/**
   Implemented custom scrollbar for filter tabs on mobile:
   - Height: 4px
   - Color: rgba(168, 85, 247, 0.3)
   - Appears only on mobile horizontal scroll
*/

// 9. ANIMATION DELAYS
/**
   Card animations:
   - Using CSS variable --card-delay
   - Cascading entrance animation: 100ms + (idx * 50ms)
   - Smooth cubic-bezier(0.34, 1.56, 0.64, 1)
*/

export default {
  responsiveGuide: "See CSS comments for detailed breakpoints"
};
