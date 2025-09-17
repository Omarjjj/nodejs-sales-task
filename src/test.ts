import express from 'express';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

interface Transactions {

  productId: string;
  amount: number;
}

const transactions: Transactions[]=[

    { productId: 'A', amount: 100 },
    { productId: 'B', amount: 200 },
    { productId: 'A', amount: 150 },
    { productId: 'C', amount: 300 },
    { productId: 'B', amount: 250 },
    { productId: 'A', amount: 75 },
    { productId: 'C', amount: 400 },
    { productId: 'D', amount: 500 }

]



const processData = (transactions: Transactions[]) => {
    const grouped = transactions.reduce((acc, t) => {
        if (!acc[t.productId]){
          acc[t.productId] = [];
        } 
        acc[t.productId].push(t.amount);
        return acc;
    }, {} as Record<string, number[]>);

    const totals = Object.entries(grouped).reduce((acc,[id,amounts])=>{

      acc[id] = amounts.reduce((sum,amount)=>sum + amount ,0)
      return acc;

    } , {} as Record<string,number> );

    return{grouped,totals};
}

const validateProduct = (productId: string, amount: number) => {
  if (!productId || typeof productId !== 'string')
    return 'invalid product';

  if (typeof amount !== 'number' || amount <= 0)
    return 'invalid amount';

  return null;
};

app.get('/',(req,res)=>{

  res.send('the server is Running!');

})

app.get('/product',(req,res)=>{
  try {

    const {grouped} = processData (transactions);
    const data = Object.entries(grouped).map(([productId,amounts])=>({productId,amounts}));
    res.status(200).json({success :true ,data})
    
  } catch (error) {
    res.status(400).json({success : false });
  }

})

app.get('/product/totals',(req,res)=>{
  try {
    const { totals } = processData(transactions);
    const data = Object.entries(totals).map(([proudctId , totalAmounts])=>({proudctId,totalAmounts}));
    res.status(200).json({success:true , data});
    
  } catch (error) {
    res.status(400).json({success:false });
  }

})

app.get('/product/:id/total' ,(req,res)=>{

  try {

    const {id} = req.params
    const {totals} = processData(transactions);

    if(!totals[id]){

      return res.status(404).send("error 404 product not found");
    }

    res.status(200).json({success:true , data:{productId:id , amount:totals[id]}});
  } catch (error) {
    res.status(400).json({success:false , message :'fialed to get the product amount'});
  }
})


app.get('/api/products/:id/amounts', (req, res) => {
    try {
        const { id } = req.params;
        const { grouped } = processData(transactions);
        
        if (!grouped[id]?.length) {
      return res.status(404).send("error 404 product not found");
        }
        
    res.status(200).json({success:true , data:{productId:id , amount:grouped[id]}});
    } catch {
    res.status(400).json({success:false , message :'fialed to get the product amount'});
    }
});


const sendResponse = (res: express.Response, statusCode: number, data: any) => {
    res.status(statusCode).json({ success: true, ...data });
};

app.post('/api/products', (req, res) => {
    try {
        const { productId, amount } = req.body;
        const error = validateProduct(productId, amount);
        
        if (error) {
            res.status(400).json({success:false , message :'fialed to Post the product '});
        }
        
        const newTransaction = { productId, amount };
        transactions.push(newTransaction);
        
        sendResponse(res, 201, { message: 'Product added', data: newTransaction });
    } catch {
          res.status(400).json({success:false , message :'fialed to Post the product '});
    }
});
