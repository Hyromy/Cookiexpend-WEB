import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  BarChart3,
  Clock,
  Factory,
  Filter,
} from "lucide-react"

import { StateGate } from "../../components/State"
import { Table } from "../../components/Table"
import useApi from "../../hooks/useApi"
import { measurementService } from "../../services/cookiexpend"
import { SelectField } from "../../components/Form" 
import { Button } from "../../components/Button"
import type {
  measurementResponse,
  measurementListResponse,
} from "../../types/api"

export default function Measurements() {
  const {
    data,
    error,
    isLoading,
    request,
  } = useApi<measurementListResponse>()

  const [selectedStation, setSelectedStation] = useState("all")
  const [selectedProcess, setSelectedProcess] = useState("all")

  const requestData = useCallback(() => {
    request(measurementService.get())
  }, [request])

  useEffect(() => {
    requestData()
  }, [requestData])

const measurements = useMemo(() => data?.data ?? [], [data?.data]) 

  const stations = useMemo(
    () =>
      Array.from(
        new Set(measurements.map(measurement => measurement.station))
      ).sort(),
    [measurements]
  )

  const processes = useMemo(
    () =>
      Array.from(
        new Set(measurements.map(measurement => measurement.process))
      ).sort(),
    [measurements]
  )

  const filteredMeasurements = useMemo(() => {
    return measurements.filter(measurement => {
      const stationMatches =
        selectedStation === "all" ||
        measurement.station === selectedStation

      const processMatches =
        selectedProcess === "all" ||
        measurement.process === selectedProcess

      return stationMatches && processMatches
    })
  }, [
    measurements,
    selectedStation,
    selectedProcess,
  ])

  const statistics = useMemo(() => {
    if (filteredMeasurements.length === 0) {
      return {
        total: 0,
        average: 0,
        minimum: 0,
        maximum: 0,
      }
    }

    const times = filteredMeasurements.map(
      measurement => Number(measurement.time_ms) / 1000
    )

    const total = times.length

    return {
      total,
      average:
        times.reduce((sum, time) => sum + time, 0) / total,
      minimum: Math.min(...times),
      maximum: Math.max(...times),
    }
  }, [filteredMeasurements])

  const clearFilters = () => {
    setSelectedStation("all")
    setSelectedProcess("all")
  }

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{
        title: "Mediciones",
      }}
      errorProps={{
        onRetry: requestData,
      }}
    >
      <MeasurementView
        filteredMeasurements={filteredMeasurements}
        statistics={statistics}
        stations={stations}
        processes={processes}
        selectedStation={selectedStation}
        selectedProcess={selectedProcess}
        setSelectedStation={setSelectedStation}
        setSelectedProcess={setSelectedProcess}
        clearFilters={clearFilters}
      />
    </StateGate>
  )
}

type MeasurementViewProps = {
  filteredMeasurements: measurementResponse[]
  statistics: {
    total: number
    average: number
    minimum: number
    maximum: number
  }
  stations: string[]
  processes: string[]
  selectedStation: string
  selectedProcess: string
  setSelectedStation: (value: string) => void
  setSelectedProcess: (value: string) => void
  clearFilters: () => void
}

function MeasurementView({
  filteredMeasurements,
  statistics,
  stations,
  processes,
  selectedStation,
  selectedProcess,
  setSelectedStation,
  setSelectedProcess,
  clearFilters,
}: MeasurementViewProps) {
  return (
    <div className="space-y-6">

      <div>
        <div className="text-2xl font-semibold text-fg">
          Mediciones
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Historial de tiempos registrados por las estaciones de medición.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de mediciones"
          value={statistics.total.toLocaleString()}
          description="Registros encontrados"
          icon={<Activity size={22} />}
        />

        <StatCard
          title="Tiempo promedio"
          value={`${statistics.average.toFixed(3)} s`}
          description="Promedio de duración"
          icon={<Clock size={22} />}
        />

        <StatCard
          title="Tiempo mínimo"
          value={`${statistics.minimum.toFixed(3)} s`}
          description="Menor duración registrada"
          icon={<BarChart3 size={22} />}
        />

        <StatCard
          title="Tiempo máximo"
          value={`${statistics.maximum.toFixed(3)} s`}
          description="Mayor duración registrada"
          icon={<Clock size={22} />}
        />
      </div>

      <div className="rounded-xl border border-muted/50 bg-bg/40 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} />

          <h2 className="font-medium text-fg">
            Filtros
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <SelectField
            name="station-filter"
            label="Estación"
            selected={selectedStation}
            options={[
              {
                value: "all",
                label: "Todas las estaciones",
              },
              ...stations.map(station => ({
                value: station,
                label: station,
              })),
            ]}
            onChange={setSelectedStation}
          />

          <SelectField
            name="process-filter"
            label="Proceso"
            selected={selectedProcess}
            options={[
              {
                value: "all",
                label: "Todos los procesos",
              },
              ...processes.map(process => ({
                value: process,
                label: process,
              })),
            ]}
            onChange={setSelectedProcess}
          />

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          </div>

        </div>
      </div>

      <div className="rounded-xl border border-muted/50 bg-bg/40 p-4">

        <div className="mb-4 flex items-center gap-2">
          <Factory size={18} />

          <div>
            <h2 className="font-medium text-fg">
              Historial de mediciones
            </h2>

            <p className="text-xs text-muted-foreground">
              {filteredMeasurements.length} mediciones encontradas
            </p>
          </div>
        </div>

        <Table
          data={filteredMeasurements}
          exportToExcel={{
            sheetName: "Mediciones",
          }}
          filename="Mediciones"
          columns={[
            {
              accessorKey: "station",
              header: "Estación",
            },
            {
              accessorKey: "process",
              header: "Proceso",
            },
            {
              accessorKey: "time_ms",
              header: "Tiempo (ms)",
            },
            {
              accessorKey: "created_at",
              header: "Fecha de medición",
              cell: ({ getValue }) => {
                const value = getValue()

                if (!value) {
                  return "-"
                }

                const date = new Date(String(value))

                if (Number.isNaN(date.getTime())) {
                  return String(value)
                }

                return date.toLocaleString("es-MX", {
                  dateStyle: "short",
                  timeStyle: "medium",
                })
              },
            },
          ]}
        />

      </div>
    </div>
  )
}


/*
 * Tarjeta de estadística
 */
type StatCardProps = {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}

function StatCard({
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-muted/50 bg-bg/40 p-5 transition-all hover:border-primary/30">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-fg">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          {icon}
        </div>

      </div>

    </div>
  )
}