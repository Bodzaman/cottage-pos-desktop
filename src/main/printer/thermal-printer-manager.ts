
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer'
import { PrintJob, PrintJobStatus, Receipt } from '@shared/data/models'
import { DatabaseManager } from '../offline/database-manager'

interface PrintJobResult {
  success: boolean
  message: string
  jobId?: string
}

export class ThermalPrinterManager {
  private printer: ThermalPrinter
  private dbManager: DatabaseManager
  private isConnected = false

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager
    this.printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: 'tcp://192.168.1.123',
      characterSet: 'UK'
    })
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      this.isConnected = await this.printer.isPrinterConnected()
      console.log(`Printer connected: ${this.isConnected}`)
    } catch (error) {
      console.error('Failed to initialize printer connection:', error)
      this.isConnected = false
    }
  }

  public async getPrinterStatus(): Promise<{ isConnected: boolean }> {
    try {
      this.isConnected = await this.printer.isPrinterConnected()
      return { isConnected: this.isConnected }
    } catch (error) {
      console.error('Error checking printer status:', error)
      this.isConnected = false
      return { isConnected: false }
    }
  }

  public async addPrintJob(receipt: Receipt, options: any): Promise<PrintJobResult> {
    const job: Omit<PrintJob, 'id'> = {
      receipt,
      status: PrintJobStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    try {
      const newJobId = await this.dbManager.addPrintJob(job)
      this.processPrintQueue()
      return { success: true, message: 'Job added to queue.', jobId: newJobId }
    } catch (error) {
      const err = error as Error
      return { success: false, message: `Failed to add job to DB: ${err.message}` }
    }
  }

  public addPrintJobToQueue(receipt: Receipt, options: any): Promise<PrintJobResult> {
      return this.addPrintJob(receipt, options)
  }

  public async processPrintQueue(): Promise<void> {
    if (!this.isConnected) {
      console.log('Printer not connected. Skipping print queue processing.')
      return
    }

    const pendingJobs = await this.dbManager.getPendingPrintJobs()
    if (!pendingJobs || typeof pendingJobs[Symbol.iterator] !== 'function') {
        console.error('getPendingPrintJobs did not return an iterable object.')
        return
    }

    for (const job of pendingJobs) {
      try {
        await this.dbManager.updatePrintJobStatus(job.id, PrintJobStatus.PRINTING)
        this.printer.clear()
        this.printer.println('Cottage Tandoori')
        this.printer.println(`Order: ${job.receipt.orderNumber}`)
        this.printer.println('-'.repeat(32))
        job.receipt.items.forEach((item) => {
          this.printer.tableCustom([{ text: `${item.quantity}x ${item.name}`, align: 'LEFT', width: 0.75 }, { text: `£${item.price.toFixed(2)}`, align: 'RIGHT', width: 0.25 }])
        })
        this.printer.println('-'.repeat(32))
        this.printer.println(`Total: £${job.receipt.total.toFixed(2)}`)
        this.printer.cut()

        await this.printer.execute()
        await this.dbManager.updatePrintJobStatus(job.id, PrintJobStatus.COMPLETED)
        console.log(`Successfully printed job ${job.id}`)
      } catch (error) {
        console.error(`Failed to print job ${job.id}:`, error)
        await this.dbManager.updatePrintJobStatus(job.id, PrintJobStatus.FAILED)
      }
    }
  }
}
