// KOOS (Knee injury and Osteoarthritis Outcome Score) — item text is based on
// the publicly documented KOOS structure (koos.nu). The five subscales below
// are official; item wording here is paraphrased for brevity and consistency
// of response scale. Before using this in a real deployment, cross-check
// against the official KOOS manual/translation and credit KOOS appropriately.
export const koosSubscales = [
  {
    key: 'pain',
    label: 'Pain',
    items: [
      'How often do you experience knee pain?',
      'Twisting or pivoting on your knee',
      'Straightening your knee fully',
      'Bending your knee fully',
      'Walking on a flat surface',
      'Going up or down stairs',
      'At night while in bed',
      'Sitting or lying down',
      'Standing upright'
    ]
  },
  {
    key: 'symptoms',
    label: 'Other symptoms',
    items: [
      'Swelling in your knee',
      'Grinding, clicking, or other noise from your knee',
      'Your knee catching or hanging up when moving',
      'Difficulty fully straightening your knee',
      'Difficulty fully bending your knee',
      'Knee stiffness right after waking up in the morning',
      'Knee stiffness after sitting, lying, or resting later in the day'
    ]
  },
  {
    key: 'adl',
    label: 'Function in daily living',
    items: [
      'Descending stairs',
      'Ascending stairs',
      'Rising from sitting',
      'Standing',
      'Bending to the floor or picking up an object',
      'Walking on a flat surface',
      'Getting in or out of a car',
      'Going shopping',
      'Putting on socks or stockings',
      'Rising from bed',
      'Taking off socks or stockings',
      'Lying in bed (turning over, keeping knee position)',
      'Getting in or out of the bath',
      'Sitting',
      'Getting on or off the toilet',
      'Heavy household duties',
      'Light household duties'
    ]
  },
  {
    key: 'sport',
    label: 'Function in sport and recreation',
    items: [
      'Squatting',
      'Running',
      'Jumping',
      'Twisting or pivoting on your affected knee',
      'Kneeling'
    ]
  },
  {
    key: 'qol',
    label: 'Quality of life',
    items: [
      'How often are you aware of your knee problem?',
      'Have you modified your lifestyle to avoid activities that could harm your knee?',
      'How much are you troubled by a lack of confidence in your knee?',
      'In general, how much difficulty do you have with your knee?'
    ]
  }
]

// Standard KOOS 5-point response scale.
export const koosOptions = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Severe' },
  { value: 4, label: 'Extreme' }
]
