import React, { useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

const toastTypes = {
  success: { icon: CheckCircleIcon, bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-400' },
  error: { icon: XCircleIcon, bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-400' },
  info: { icon: InformationCircleIcon, bgColor: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-400' },
  warning: { icon: ExclamationTriangleIcon, bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-400' },
}

const Toast = ({ id, type, title, message, onClose, duration = 5000 }) => {
  const { icon: Icon, bgColor, textColor, borderColor } = toastTypes[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  return (
    <div
      className={`${bgColor} ${borderColor} border-l-4 rounded-lg shadow-lg p-4 mb-3 animate-slide-up`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && <p className={`text-sm font-medium ${textColor}`}>{title}</p>}
          <p className={`text-sm ${textColor} opacity-90`}>{message}</p>
        </div>
        <button
          onClick={() => onClose(id)}
          className={`ml-4 flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast