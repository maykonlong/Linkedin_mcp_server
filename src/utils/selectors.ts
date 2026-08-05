export const SELECTORS = {
  MODAL: {
    DIALOG: 'dialog, div[role="dialog"]',
    CLOSE_BTN: 'button[aria-label="Fechar"], button[aria-label="Close"], button[aria-label="Dismiss"]',
    SAVE_BTN: 'button[type="submit"], button:has-text("Save"), button:has-text("Salvar")',
  },
  PROFILE: {
    HEADLINE: {
      INPUT: 'input[name="headline"]',
      TIPTAP: 'div.tiptap.ProseMirror',
      EDIT_BTN: 'button[aria-label*="headline" i], button:has-text("Headline")',
      INTRO_BTN: 'a[href*="/edit/forms/intro/"], button[aria-label*="Edit intro"]'
    },
    ABOUT: {
      TEXTAREA: 'textarea[id*="summary"], textarea[name*="summary"]'
    },
    EXPERIENCE: {
      TITLE_INPUT: 'input[name="title"]',
      COMPANY_INPUT: 'input[name="companyName"]',
      LOCATION_INPUT: 'input[name="location"]',
      DESC_TEXTAREA: 'textarea[name="description"]',
      START_DATE: 'input[name="timePeriodStartDate"]',
      END_DATE: 'input[name="timePeriodEndDate"]',
      CURRENT_JOB_CHECK: 'input[name="currentJob"]',
      FORM_URL: '/edit/forms/position/new/'
    }
  },
  AUTH: {
    EMAIL_INPUT: 'input#session_key, input#username',
    PASS_INPUT: 'input#session_password, input#password',
    SUBMIT_BTN: 'button[type="submit"], .login__form_action_container button'
  }
};
