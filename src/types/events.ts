export type eventAction =
	"created" |
	"updated" |
	"deleted"

export type eventModel = 
	"establishment" |
	"factory" |
	"store" |
	"product" |
	"delivery" |
	"package" |
	"inventory" |
	"sale"

export type eventData = {
	action: eventAction
	data: unknown
	event: string
	model: eventModel
	source: string
	updated_at: string
	version: number
	status?: string
}
