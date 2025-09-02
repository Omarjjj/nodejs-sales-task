require ('dotenv').config();
const fs = require('fs/promises');
const path = require('path');


const INPUT_FILE = path.join('data', 'sales.json');
const OUT_PUT_File = path.join('data','results.json');


function CalculateTotalSales(transactions){


    if(!Array.isArray(transactions)){
        throw new Error("Invalid transactions data");
    }   

    const total = transactions.reduce((acc, item, idx) => {   
        if(!item || typeof item.productId ==="undefined" || typeof item.amount === "undefined" ){

            console.warn(`skipping item #${idx}: missing productId or amount`);
            return acc;
        }
        return acc + Number(item.amount);
    }, 0);

    return total;    

}

async function main (){
    const raw = await fs.readFile(INPUT_FILE, 'utf8');

    let transactions;
    try {
        transactions = JSON.parse(raw);

    } catch(err){

        throw new Error(`failed to parse ${INPUT_FILE} as JSON` )
    }

    const totals = CalculateTotalSales(transactions)
    const outputJ = JSON.stringify({ totalSales: totals },null,2);

    await fs.writeFile(OUT_PUT_File, outputJ , 'utf8')

    console.log('total sales written to', OUT_PUT_File);
    console.log('you can see them in \n',outputJ);

}

main().catch(function(err) {

    console.error('error:', err.message);
    process.exit(1);

});

module.exports = {CalculateTotalSales};
