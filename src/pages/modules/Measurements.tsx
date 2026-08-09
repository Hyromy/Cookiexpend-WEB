import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  BarChart3,
  Clock,
  Factory,
  Filter,
  RotateCcw,
} from "lucide-react"

import { StateGate } from "../../components/State"
import { Table } from "../../components/Table"
import useApi from "../../hooks/useApi"
import { measurementService } from "../../services/cookiexpend"
import type { measurementResponse } from "../../types/api"

export default function Measurements() {
  const {
    data,
    error,
    isLoading,
    request,
  } = useApi<measurementResponse[]>()

  const [selectedStation, setSelectedStation] = useState("all")
  const [selectedProcess, setSelectedProcess] = useState("all")

  const requestData = useCallback(() => {
    request(measurementService.get())
  }, [request])

  useEffect(() => {
    requestData()
  }, [requestData])

  const measurements = data || []

  /*
   * Estaciones disponibles
   */
  const stations = useMemo(() => {
    return Array.from(
      new Set(measurements.map(measurement => measurement.station))
    ).sort()
  }, [measurements])

  /*
   * Procesos disponibles
   */
  const processes = useMemo(() => {
    return Array.from(
      new Set(measurements.map(measurement => measurement.process))
    ).sort()
  }, [measurements])

  /*
   * Aplicar filtros
   */
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

  /*
   * Estadísticas
   */
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
      measurement => Number(measurement.time_seconds)
    )

    const total = times.length

    const average =
      times.reduce((sum, time) => sum + time, 0) / total

    const minimum = Math.min(...times)
    const maximum = Math.max(...times)

    return {
      total,
      average,
      minimum,
      maximum,
    }
  }, [filteredMeasurements])

  /*
   * Limpiar filtros
   */
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
      <div className="space-y-6">

        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-semibold text-fg">
            Mediciones
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Historial de tiempos registrados por las estaciones de medición.
          </p>
        </div>

        {/* Tarjetas estadísticas */}
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

        {/* Filtros */}
        <div className="rounded-xl border border-muted/50 bg-bg/40 p-4">

          <div className="mb-4 flex items-center gap-2">
            <Filter size={18} />

            <h2 className="font-medium text-fg">
              Filtros
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Estación */}
            <div>
              <label
                htmlFor="station-filter"
                className="mb-1.5 block text-sm font-medium text-fg"
              >
                Estación
              </label>

              <select
                id="station-filter"
                value={selectedStation}
                onChange={event =>
                  setSelectedStation(event.target.value)
                }
                className="w-full rounded-lg border border-muted/50 bg-bg px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">
                  Todas las estaciones
                </option>

                {stations.map(station => (
                  <option
                    key={station}
                    value={station}
                  >
                    {station}
                  </option>
                ))}
              </select>
            </div>

            {/* Proceso */}
            <div>
              <label
                htmlFor="process-filter"
                className="mb-1.5 block text-sm font-medium text-fg"
              >
                Proceso
              </label>

              <select
                id="process-filter"
                value={selectedProcess}
                onChange={event =>
                  setSelectedProcess(event.target.value)
                }
                className="w-full rounded-lg border border-muted/50 bg-bg px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">
                  Todos los procesos
                </option>

                {processes.map(process => (
                  <option
                    key={process}
                    value={process}
                  >
                    {process}
                  </option>
                ))}
              </select>
            </div>

            {/* Limpiar */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-muted/50 bg-bg/40 px-4 py-2 text-sm font-medium transition-all hover:bg-muted/20 active:scale-[0.98]"
              >
                <RotateCcw size={16} />

                Limpiar filtros
              </button>
            </div>

          </div>
        </div>

        {/* Tabla */}
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
                accessorKey: "time_seconds",
                header: "Tiempo (s)",
                cell: ({ getValue }) => {
                  const value = Number(getValue())

                  return `${value.toFixed(3)} s`
                },
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
    </StateGate>
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