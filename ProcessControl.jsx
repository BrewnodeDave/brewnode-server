import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import { 
  Play, 
  Thermometer, 
  Timer, 
  Droplets, 
  ArrowRight,
  Flame,
  Snowflake,
  Beaker,
  Recycle
} from 'lucide-react'
import { brewnodeAPI } from '../services/brewnode'
import ProcessCard from '../components/ProcessCard'
import MashProfile from '../components/MashProfile'
import FermentationProfile from '../components/FermentationProfile'
import TransferControls from '../components/TransferControls'

const ProcessControl = () => {
  const [activeProcess, setActiveProcess] = useState(null)
  const queryClient = useQueryClient()

  const processes = [
    {
      id: 'fill',
      name: 'Fill Kettle',
      icon: Droplets,
      color: 'blue',
      description: 'Fill the kettle with water'
    },
    {
      id: 'mash',
      name: 'Mash',
      icon: Thermometer,
      color: 'orange',
      description: 'Perform mash steps'
    },
    {
      id: 'transfer',
      name: 'Transfer',
      icon: ArrowRight,
      color: 'purple',
      description: 'Transfer between vessels'
    },
    {
      id: 'boil',
      name: 'Boil',
      icon: Flame,
      color: 'red',
      description: 'Boil the wort'
    },
    {
      id: 'chill',
      name: 'Chill',
      icon: Snowflake,
      color: 'cyan',
      description: 'Chill the wort'
    },
    {
      id: 'ferment',
      name: 'Ferment',
      icon: Beaker,
      color: 'green',
      description: 'Fermentation process'
    },
  ]

  const processHandlers = {
    fill: useMutation(
      (litres) => brewnodeAPI.fill(litres),
      { onSuccess: () => queryClient.invalidateQueries() }
    ),
    boil: useMutation(
      (mins) => brewnodeAPI.boil(mins),
      { onSuccess: () => queryClient.invalidateQueries() }
    ),
    mash: useMutation(
      (steps) => brewnodeAPI.mash(steps),
      { onSuccess: () => queryClient.invalidateQueries() }
    ),
    recirculate: {
      start: useMutation(
        ({ tempC, dutyCycle }) => brewnodeAPI.startRecirculation(tempC, dutyCycle),
        { 
          onSuccess: () => {
            queryClient.invalidateQueries('recirculationStatus')
            queryClient.invalidateQueries()
          }
        }
      ),
      stop: useMutation(
        () => brewnodeAPI.stopRecirculation(),
        { 
          onSuccess: () => {
            queryClient.invalidateQueries('recirculationStatus')
            queryClient.invalidateQueries()
          }
        }
      ),
      updateDutyCycle: useMutation(
        (dutyCycle) => brewnodeAPI.updateRecirculationDutyCycle(dutyCycle),
        { 
          onSuccess: () => {
            queryClient.invalidateQueries('recirculationStatus')
            queryClient.invalidateQueries()
          }
        }
      ),
    },
    chill: useMutation(
      (profile) => brewnodeAPI.chill(profile),
      { onSuccess: () => queryClient.invalidateQueries() }
    ),
    ferment: useMutation(
      (steps) => brewnodeAPI.ferment(steps),
      { onSuccess: () => queryClient.invalidateQueries() }
    ),
    kettleTemp: useMutation(
      ({ temp, mins }) => brewnodeAPI.setKettleTemp(temp, mins),
      { onSuccess: () => queryClient.invalidateQueries() }
    ),
  }

  const renderProcessModal = () => {
    switch (activeProcess) {
      case 'fill':
        return <FillModal onClose={() => setActiveProcess(null)} onSubmit={processHandlers.fill} />
      case 'boil':
        return <BoilModal onClose={() => setActiveProcess(null)} onSubmit={processHandlers.boil} />
      case 'mash':
        return <MashProfile onClose={() => setActiveProcess(null)} onSubmit={processHandlers.mash} />
      case 'chill':
        return <ChillModal onClose={() => setActiveProcess(null)} onSubmit={processHandlers.chill} />
      case 'ferment':
        return <FermentationProfile onClose={() => setActiveProcess(null)} onSubmit={processHandlers.ferment} />
      case 'transfer':
        return <TransferControls onClose={() => setActiveProcess(null)} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Process Control</h1>
        <div className="flex items-center space-x-3 text-base text-gray-500">
          <Play className="w-6 h-6" />
          <span className="hidden sm:inline">Automated Brewing Processes</span>
          <span className="sm:hidden">Brewing Controls</span>
        </div>
      </div>

      {/* Process Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {processes.map((process) => (
          <ProcessCard
            key={process.id}
            process={process}
            onClick={() => setActiveProcess(process.id)}
            isLoading={processHandlers[process.id]?.isLoading}
          />
        ))}
      </div>

      {/* Quick Temperature Control */}
      <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Thermometer className="w-7 h-7 mr-3 text-red-600" />
          Quick Temperature Control
        </h3>
        <KettleTempControl onSubmit={processHandlers.kettleTemp} />
      </div>

      {/* RIMS Recirculation Control */}
      <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Recycle className="w-7 h-7 mr-3 text-purple-600" />
          RIMS Recirculation
        </h3>
        <RecirculationControl handlers={processHandlers.recirculate} />
      </div>

      {/* Process Modals */}
      {renderProcessModal()}
    </div>
  )
}

const KettleTempControl = ({ onSubmit }) => {
  const [temp, setTemp] = useState('')
  const [mins, setMins] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit.mutate({ temp: parseFloat(temp), mins: parseInt(mins) })
    setTemp('')
    setMins('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Temperature:</label>
        <input
          type="number"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          placeholder="65"
          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
          required
        />
        <span className="text-sm text-gray-500">°C</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Duration:</label>
        <input
          type="number"
          value={mins}
          onChange={(e) => setMins(e.target.value)}
          placeholder="60"
          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
          required
        />
        <span className="text-sm text-gray-500">mins</span>
      </div>
      
      <button
        type="submit"
        disabled={onSubmit.isLoading}
        className="btn btn-primary"
      >
        {onSubmit.isLoading ? 'Setting...' : 'Set Temperature'}
      </button>
    </form>
  )
}

const FillModal = ({ onClose, onSubmit }) => {
  const [litres, setLitres] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit.mutate(parseFloat(litres))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">Fill Kettle</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Volume (Litres)</label>
            <input
              type="number"
              value={litres}
              onChange={(e) => setLitres(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="25"
              min="1"
              max="49"
              required
            />
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="flex-1 btn btn-primary">
              Start Fill
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const BoilModal = ({ onClose, onSubmit }) => {
  const [mins, setMins] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit.mutate(parseInt(mins))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">Boil Kettle</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
            <input
              type="number"
              value={mins}
              onChange={(e) => setMins(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="60"
              min="0"
              max="100"
              required
            />
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="flex-1 btn btn-primary">
              Start Boil
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ChillModal = ({ onClose, onSubmit }) => {
  const [profile, setProfile] = useState([{ tempC: 20, mins: 30 }])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit.mutate(profile)
    onClose()
  }

  const addStep = () => {
    setProfile([...profile, { tempC: 20, mins: 30 }])
  }

  const updateStep = (index, field, value) => {
    const newProfile = [...profile]
    newProfile[index][field] = value
    setProfile(newProfile)
  }

  const removeStep = (index) => {
    setProfile(profile.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Chill Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {profile.map((step, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 border rounded">
              <div className="flex-1">
                <input
                  type="number"
                  value={step.tempC}
                  onChange={(e) => updateStep(index, 'tempC', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border rounded text-center"
                  placeholder="20"
                />
                <span className="text-xs text-gray-500">°C</span>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={step.mins}
                  onChange={(e) => updateStep(index, 'mins', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border rounded text-center"
                  placeholder="30"
                />
                <span className="text-xs text-gray-500">mins</span>
              </div>
              {profile.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addStep}
            className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400"
          >
            + Add Step
          </button>
          
          <div className="flex space-x-2">
            <button type="submit" className="flex-1 btn btn-primary">
              Start Chill
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const RecirculationControl = ({ handlers }) => {
  const [tempC, setTempC] = useState(65)
  const [dutyCycle, setDutyCycle] = useState(50)
  const [isRunning, setIsRunning] = useState(false)

  // Query recirculation status from backend
  const { data: statusData } = useQuery(
    'recirculationStatus',
    () => brewnodeAPI.getRecirculationStatus(),
    { 
      refetchInterval: 3000 // Poll every 3 seconds
    }
  )

  // Sync local state with backend status
  useEffect(() => {
    if (statusData?.data) {
      const status = statusData.data
      setIsRunning(status.active)
      if (status.active && status.targetTemp !== null) {
        setTempC(status.targetTemp)
      }
      if (status.active && status.dutyCycle !== null) {
        setDutyCycle(status.dutyCycle)
      }
    }
  }, [statusData])

  const handleStart = (e) => {
    e.preventDefault()
    if (tempC < 0 || tempC > 100) {
      alert('Temperature must be between 0 and 100°C')
      return
    }
    if (dutyCycle < 50 || dutyCycle > 99) {
      alert('Duty cycle must be between 50 and 99%')
      return
    }
    handlers.start.mutate({ tempC, dutyCycle })
  }

  const handleStop = () => {
    handlers.stop.mutate()
  }

  const handleUpdateDutyCycle = (e) => {
    e.preventDefault()
    if (dutyCycle < 50 || dutyCycle > 99) {
      alert('Duty cycle must be between 50 and 99%')
      return
    }
    handlers.updateDutyCycle.mutate(dutyCycle)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleStart} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Mash Temperature (°C)
          </label>
          <input
            type="number"
            value={tempC}
            onChange={(e) => setTempC(parseFloat(e.target.value))}
            min="0"
            max="100"
            step="0.5"
            disabled={isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kettle Pump Duty Cycle (%)
          </label>
          <input
            type="number"
            value={dutyCycle}
            onChange={(e) => setDutyCycle(parseFloat(e.target.value))}
            min="50"
            max="99"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        {!isRunning ? (
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={handlers.start.isLoading}
              className="w-full btn btn-primary"
            >
              {handlers.start.isLoading ? 'Starting...' : 'Start Recirculation'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Mash pump runs continuously. Kettle pump duty cycle controls recirculation rate.
            </p>
          </div>
        ) : (
          <div className="md:col-span-2 space-y-2">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm font-medium text-green-800">
                ✓ Recirculation Active - Target: {tempC}°C, Duty Cycle: {dutyCycle}%
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleUpdateDutyCycle}
                disabled={handlers.updateDutyCycle.isLoading}
                className="btn btn-secondary"
              >
                {handlers.updateDutyCycle.isLoading ? 'Updating...' : 'Update Duty Cycle'}
              </button>
              <button
                type="button"
                onClick={handleStop}
                disabled={handlers.stop.isLoading}
                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
              >
                {handlers.stop.isLoading ? 'Stopping...' : 'Stop Recirculation'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default ProcessControl