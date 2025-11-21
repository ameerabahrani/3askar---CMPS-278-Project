/**
 * Selection and visual styling constants for batch selection feature
 */

// VS-1: Selected row/card background colors
export const SELECT_BG = "#e8f0fe";
export const SELECT_BG_HOVER = "#e0ecfc";

// Default row hover background (non-selected)
export const ROW_HOVER_BG = "#f8f9fa";

// VS-3: Selected card border styling
export const SELECT_BORDER_COLOR = "#1a73e8";
export const DEFAULT_BORDER_COLOR = "#e0e0e0";

// Checkbox styling
export const CHECKBOX_BG_OVERLAY = "rgba(255,255,255,0.8)";

// Transition timing
export const TRANSITION_DURATION = "0.15s";

/**
 * Get row styles based on selection state
 * @param {boolean} isSelected - Whether the row is selected
 * @returns {Object} - MUI sx style object
 */
export const getRowStyles = (isSelected) => ({
  backgroundColor: isSelected ? SELECT_BG : "transparent",
  "&:hover": { 
    backgroundColor: isSelected ? SELECT_BG_HOVER : ROW_HOVER_BG 
  },
  transition: `background-color ${TRANSITION_DURATION} ease`,
});

/**
 * Get card/paper styles based on selection state
 * @param {boolean} isSelected - Whether the card is selected
 * @returns {Object} - MUI sx style object
 */
export const getCardStyles = (isSelected) => ({
  border: isSelected ? `2px solid ${SELECT_BORDER_COLOR}` : `1px solid ${DEFAULT_BORDER_COLOR}`,
  backgroundColor: isSelected ? SELECT_BG : "#fff",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  },
});

/**
 * Checkbox overlay styles for grid view
 */
export const checkboxOverlayStyles = {
  position: "absolute",
  top: 4,
  left: 4,
  zIndex: 2,
  backgroundColor: CHECKBOX_BG_OVERLAY,
  borderRadius: 1,
};
