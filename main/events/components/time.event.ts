// events/time.event.ts
import moment from 'moment-timezone'
import log from 'electron-log'

type SendFn = (channel: string, payload: unknown) => void

export class TimeEvent {
    private timer?: NodeJS.Timeout
    private send!: SendFn

    constructor(send: SendFn) {
        this.send = send
    }

    register(intervalMs = 100) {
        if (this.timer) clearInterval(this.timer)
        this.timer = setInterval(() => {
            const humanize = moment().format('HH:mm:ss:SS')
            this.send('time_sync', { humanize })
        }, intervalMs)
        /**
         * @ts-expect-error Node Timeout unref is available at runtime
         */
        this.timer?.unref?.()
        log.info('[time.event] registered')
    }

    unregister() {
        if (this.timer) clearInterval(this.timer)
        this.timer = undefined
        log.info('[time.event] unregistered')
    }
}
