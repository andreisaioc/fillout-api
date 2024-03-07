const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;


const FILLOUT_API_BASE_URL = 'https://api.fillout.com';
const FILLOUT_API_KEY = 'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912'; 


function fetchFormResponses(formId, myFilters) {
    let url = `${FILLOUT_API_BASE_URL}/v1/api/forms/${formId}/submissions/?ok=1`;

    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Authorization': `Bearer ${FILLOUT_API_KEY}`,
                'Accept': 'application/json',
            },
        };


        if(myFilters.limit != undefined)
        {
            url += '&limit=' + myFilters.limit
        }


        if(myFilters.afterDate != undefined)
        {
            url += '&afterDate=' + myFilters.afterDate
        }

        if(myFilters.beforeDate != undefined)
        {
            url += '&beforeDate=' + myFilters.beforeDate
        }


        if(myFilters.offset != undefined)
        {
            url += '&offset=' + myFilters.offset
        }

        if(myFilters.status != undefined)
        {
            url += '&status=' + myFilters.status
        }


        if(myFilters.includeEditLink != undefined)
        {
            url += '&includeEditLink=' + myFilters.includeEditLink
        }

        if(myFilters.sort != undefined)
        {
            url += '&sort=' + myFilters.sort
        }





        https.get(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            }); 

            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`API call failed with status code ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}


function filterResponses(responses, ownFiltersArg) {

    





    if(ownFiltersArg != undefined)
    {
        let ownFilters = JSON.parse(ownFiltersArg)
        let newResponsesArray = []
        
  

            for(let i=0; i<responses.responses.length; i++)
            {
                const responseItem = responses.responses[i]
                let addItem             = false;
                let matchedConditions   = 0;
                let trueConditions      = 0;


                for(let j=0; j<responseItem.questions.length; j++)
                {
                        const questionItem = responseItem.questions[j]

                        //console.log(questionItem)

                        for(let k=0; k<ownFilters.length; k++)
                        {
                            const itemFilter = ownFilters[k]
                            
                            if(itemFilter.id == questionItem.id)
                            {
                                matchedConditions++;

                                if(itemFilter.condition == "equals")
                                {                          

                                    if(itemFilter.value == questionItem.value)
                                    {                                       
                                        addItem = true; 
                                        trueConditions++
                                    }
                                }
                                else if(itemFilter.condition == "does_not_equal")
                                {                                     
                                    
                                    if(itemFilter.value != questionItem.value)
                                    {                                       
                                        addItem = true; 
                                        trueConditions++
                                    }
                                }
                                else if(itemFilter.condition == "greater_than")
                                {                                     
                                    if(questionItem.type == "NumberInput")
                                    {
                                        if(parseInt(itemFilter.value) < parseInt(questionItem.value))
                                        {        
                        
                                            addItem = true; 
                                            trueConditions++;
                                        }
                                    }
                                    else if("DatePicker" == questionItem.type)
                                    {
                                        if(new Date(itemFilter.value) < new Date(questionItem.value))
                                        {        
                          
                                            addItem = true; 
                                            trueConditions++;
                                        }
                                    }
                                }
                                else if(itemFilter.condition == "less_than")
                                {                                     
                                    if(questionItem.type == "NumberInput")
                                    {
                                        if(parseInt(itemFilter.value) > parseInt(questionItem.value))
                                        {        
                              
                                            addItem = true; 
                                            trueConditions++;
                                        }
                                    }
                                    else if("DatePicker" == questionItem.type)
                                    {
                               
                                        if(new Date(itemFilter.value) > new Date(questionItem.value))
                                        {        
                         
                                            addItem = true; 
                                            trueConditions++;
                                        }
                                    }
                                }
                            }

                            
                        }
                     
                }
                
                if(addItem == true && trueConditions == matchedConditions) 
                newResponsesArray.push(responseItem)
            } 

            //console.log(newResponsesArray);

        responses.responses         = newResponsesArray
        responses.totalResponses    = newResponsesArray.length

        return responses
    }

    return responses;
}


// defining the endpoint
app.get('/:formId/filteredResponses', async (req, res) => {
    try {
        const { formId } = req.params;
        const limit = req.query.limit
        const afterDate = req.query.afterDate
        const beforeDate = req.query.beforeDate
        const offset = req.query.offset
        const status = req.query.status
        const includeEditLink = req.query.includeEditLink
        const sort = req.query.sort

        let myFilters = {
            limit: limit,
            afterDate: afterDate,
            beforeDate: beforeDate,
            offset: offset,
            status: status,
            includeEditLink: includeEditLink,
            sort: sort
        }


 

        const responses = await fetchFormResponses(formId, myFilters);
        const filteredResponses = filterResponses(responses, req.query.filters);
        res.json(filteredResponses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch or filter form responses' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
