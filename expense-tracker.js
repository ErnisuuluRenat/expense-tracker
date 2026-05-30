import path from "node:path"
import fsp from "node:fs/promises"
import fs, { WriteStream } from "node:fs"
import { styleText } from "node:util"
import { error } from "node:console"
import {format} from "fast-csv"

const [,,method, ...args] = process.argv
const pathDir = path.join(import.meta.dirname, "expenses.json")

const ID_WIDTH = 5
const DATE_WIDTH = 15;
const DESCRIPTION_WIDTH = 20
const AMOUNT = 10

async function readExpenses() {
    const result = await fsp.readFile(pathDir, {"encoding" : "utf-8"})
    return JSON.parse(result)
}

async function writeExpenses(latestId, expenses){
    try {
        await fsp.writeFile(pathDir, JSON.stringify({latestId, expenses}, null, 2))
    } catch(error) {
        console.log("Error appeared while trying to write a file:", error)
    }
}

function formatRow(id, date, description, amount) {
  const col1 = String(id).padEnd(ID_WIDTH)
  const col2 = String(date).padEnd(DATE_WIDTH)
  const col3 = String(description).padEnd(DESCRIPTION_WIDTH)
  const col4 = String(amount).padEnd(AMOUNT)
  
  return `${col1}${col2}${col3}${col4}`;
}

let {latestId, expenses} = await readExpenses()

function expenseTracker() {
    switch (method) {
        case "add":
            const [description, description_value, amount, amount_value] = args

            if (description !== "--description" || amount !== "--amount"){
                console.log(styleText(["red", "bold"], "Not correct written filed name(s) (description or amount) or missing values"))
                return
            }

            if (description_value === "" || Number(amount_value) < 0) {
                console.log(styleText(["red", "bold"], "Not permisable/incorrect value(s)"))
                return
            }

            const date = new Date()
            const formattedDate = {
                year: date.getFullYear(),
                month: String(date.getMonth() + 1).padStart(2,"0"),
                day: String(date.getDate()).padStart(2, "0")

            }
            latestId += 1

            const expenseObj = {
                "id": latestId,
                "date": `${formattedDate.year}/${formattedDate.month}/${formattedDate.day}`,
                "description" : description_value,
                "amount": Number(amount_value)
            }

            expenses.push(expenseObj)
            writeExpenses(latestId, expenses)

            return
        case "delete":
            const [idText, id] = args

            try {
                if (idText !== "--id") {
                    throw "Missing field '--id'"
                }

                expenses = expenses.filter((expense) => expense.id !== Number(id))
                writeExpenses(latestId, expenses)
            } catch(error){
                console.log(styleText(["red", "bold"], `Error appeared while trying to detete an expense, error: ${error}`))
            }
            return
        case "list":
            console.log(formatRow("ID", "Date", "Description", "Amount"))
            for (let expense of expenses) {
                console.log(formatRow(expense.id, expense.date, expense.description, expense.amount))
            }
            return
        case "summary":
            const summery = expenses.reduce((acc, currValue) => acc + Number(currValue.amount), 0)
            console.log(`Total expenses: $${summery}`)
            return
        default:
            console.log("Their is no such method")
    }
}

// const data = [
//     {name : "John doe", email: "john@example.com"},
//     {name : "John doe", email: "john@example.com"}
// ]

expenseTracker()

// const ws = fs.createWriteStream('./output.csv')
// const csvStream = format({headers:true})

// csvStream.pipe(WriteStream)

// csvStream.write(data)

// csvStream.end()