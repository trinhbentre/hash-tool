import { TextArea } from '@web-tools/ui'

interface HashModeProps {
  input: string
  onInputChange: (v: string) => void
}

export function HashMode({ input, onInputChange }: HashModeProps) {
  return (
    <TextArea
      label="Input"
      value={input}
      onChange={onInputChange}
      showByteCount
      placeholder="Type or paste text to hash…"
      rows={8}
    />
  )
}
