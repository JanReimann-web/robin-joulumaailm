const PASSWORD_MIN_LENGTH = 8
const DIGIT_PATTERN = /\d/
const SYMBOL_PATTERN = /[^A-Za-z0-9]/
const LOWERCASE_PATTERN = /[a-z]/
const UPPERCASE_PATTERN = /[A-Z]/

export type VisibilityPasswordValidationError =
  | 'too_short'
  | 'missing_lowercase'
  | 'missing_uppercase'
  | 'missing_number'
  | 'missing_symbol'

export const getVisibilityPasswordValidationError = (
  rawValue: string
): VisibilityPasswordValidationError | null => {
  const value = rawValue.trim()

  if (value.length < PASSWORD_MIN_LENGTH) {
    return 'too_short'
  }

  if (!LOWERCASE_PATTERN.test(value)) {
    return 'missing_lowercase'
  }

  if (!UPPERCASE_PATTERN.test(value)) {
    return 'missing_uppercase'
  }

  if (!DIGIT_PATTERN.test(value)) {
    return 'missing_number'
  }

  if (!SYMBOL_PATTERN.test(value)) {
    return 'missing_symbol'
  }

  return null
}

export const isValidVisibilityPassword = (rawValue: string) => {
  return getVisibilityPasswordValidationError(rawValue) === null
}

export const VISIBILITY_PASSWORD_MIN_LENGTH = PASSWORD_MIN_LENGTH
