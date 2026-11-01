/** Shared text stressors: stable identities, Unicode, and a long unbroken token. */
export const stressText = {
  multilingualDestination: 'Saint-Étienne — Gare routière / 中央駅',
  longStation: 'North branch with a long station name',
  unbroken: 'SyntheticDestinationWithoutAnyWhitespaceToOfferABreak',
}
export const stressPickerOptions = [
  { value: 'unicode', label: stressText.multilingualDestination, detail: 'Unicode and mixed scripts' },
  { value: 'unbroken', label: stressText.unbroken, detail: 'No whitespace' },
  { value: 'zero', label: '0', detail: 'A measured zero' },
]
