const OVERRIDE = window.CODIT_SETTINGS = {}

const OVERRIDE_OR_DEFAULT = (key, def) => (OVERRIDE[key] !== undefined ? OVERRIDE[key] : def)

const acceptFiletypes = '.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel,text/plain,text/csv,application/x-spss-sav,.xlsx,.xls,application/spss,.sav'

/* eslint-disable no-multi-spaces */
module.exports = {
  overrideSettings: (key, val) => { OVERRIDE[key] = val },

  // Maximum number of answers a survey is allowed to have
  get MAX_ANSWERS_PER_SURVEY ()   { return OVERRIDE_OR_DEFAULT('MAX_ANSWERS_PER_SURVEY', 10000) },

  // Maximum number of questions a project is allowed to have
  get MAX_QUESTIONS_PER_PROJECT ()   { return OVERRIDE_OR_DEFAULT('MAX_QUESTIONS_PER_PROJECT', 10) },

  // Maximum number of codes a survey is allowed to have
  get MAX_CODES_PER_SURVEY ()     { return OVERRIDE_OR_DEFAULT('MAX_CODES_PER_SURVEY', 150) },

  // Minimal number of answers that have to be coded before training begings
  get MIN_TRAIN_ANSWERS ()        { return OVERRIDE_OR_DEFAULT('MIN_TRAIN_ANSWERS', 20) },

  // Minimal number of answers that have to be changed before training is requested again
  get MIN_RETRAIN_ANSWERS ()      { return OVERRIDE_OR_DEFAULT('MIN_RETRAIN_ANSWERS', 20) },

  // Minimal validation set F1 required to write predictions
  get MIN_PREDICTION_ACCURACY ()  { return OVERRIDE_OR_DEFAULT('MIN_PREDICTION_ACCURACY', 0.0) },

  // The filetypes which are accepted when uploading answers or codes
  get ACCEPT_UPLOAD_FILETYPES ()  { return OVERRIDE_OR_DEFAULT('ACCEPT_UPLOAD_FILETYPES', acceptFiletypes) },

  // The maximum file size allowed when uploading
  get MAX_UPLOAD_FILESIZE_MB ()   { return OVERRIDE_OR_DEFAULT('MAX_UPLOAD_FILESIZE_MB', 14) },

  // Number of seconds between two messages of James when focus mode is activted (excludes tips)
  get JAMES_FOCUS_MSG_INTERVAL () { return OVERRIDE_OR_DEFAULT('JAMES_FOCUS_MSG_INTERVAL', 60 * 2.5) },

  // Activation of threshold slider
  get THRESHOLD_SLIDER ()         { return OVERRIDE_OR_DEFAULT('THRESHOLD_SLIDER', false) }
}
