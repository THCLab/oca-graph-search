export class GetOperators {
  call (type: string) {
    return operators[type] || []
  }
}

const operators: Record<string, string[]> = {
  number: [
    '=', '>', '>=', '<', '<='
  ],
  string: [
    'is'
  ]
}
