'use strict'
import 'dotenv/config'
import Table from 'cli-table'
import {mean, standardDeviation} from 'simple-statistics'
import * as mysql from 'mysql2/promise'
import { connect } from '@planetscale/database'

const connectionString = process.env.DATABASE_URL

const SAMPLES = process.env.N_SAMPLES === undefined
    ? 20
    : Math.max(parseInt(process.env.N_SAMPLES), 1)

const planetscaleClient = connect({
    url: connectionString
})
async function runPlanetscale() {

    const startTime = performance.now()
    await planetscaleClient.execute(`SELECT 1;`)
    return performance.now() - startTime
}

const mysqlClient = await mysql.createConnection({
    uri: connectionString,
    ssl: { rejectUnauthorized: true }
})

async function runMysql() {
    const startTime = performance.now()
    await mysqlClient.query(`SELECT 1;`)
    const endTime = performance.now()
    return endTime - startTime
}

const table = new Table({
    head: ['Package',  'query'],
    colAligns: ['left', 'middle'],
})

async function test(packageName, fn) {
    const results = []
    for (let i=0; i< SAMPLES; i++) {
        results.push(await fn())
    }

    const meanValue = mean(results)
    const stdDev = standardDeviation(results)
    table.push([packageName, `${meanValue.toFixed(3)}±${stdDev.toFixed(3)}ms`])

}

await test('mysql2', runMysql)
await mysqlClient.end()
await test('planetscale', runPlanetscale)
console.log(table.toString())
