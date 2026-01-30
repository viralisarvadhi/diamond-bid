import { useState, FormEvent } from 'react'

interface LoginFormData {
  email: string
  password: string
}

export const useLoginForm = (onSubmit: (data: LoginFormData) => void) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return {
    formData,
    errors,
    handleChange,
    handleSubmit,
  }
}
