           //TODO:
            // - handle errors elegantly
            // {rand10-100} placeholder in url
            // Input validation
            // Default button on enter

            //Initialization!
            var trowtemplate='<tr><th scope="row">#date#</th><td>#details#</td><th scope="row">#rps#</th><td>#min#</td><td>#avg#</td><td>#median#</td><td>#max#</td><td><div class="btn-group" role="group"><button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#runModal" onclick=\'javascript:setFormValues("#target#","#users#","#requests#");\'>Repeat</button><button type="button" class="btn btn-danger" onclick=\'javascript:deleteEntry("#timeid#");\'>Delete</button></div></td></tr>';

            var urlhistoryStr=localStorage.getItem('urlhistory');
            var urlhistory=[];
            if(urlhistoryStr)   urlhistory=JSON.parse(urlhistoryStr);
            var resultshistoryStr=localStorage.getItem('resultshistory');
            var resultshistory=[];
            if(resultshistoryStr) resultshistory=JSON.parse(resultshistoryStr);


            //Set form defaults
            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop),
            });
            setFormValues(
                params.url ?? localStorage.getItem('target'),
                params.users ?? localStorage.getItem('threads'),
                params.requests ?? localStorage.getItem('reqgoal')
            );

            if(urlhistory.length>0){
                //Show history
                ShowHistory(localStorage.getItem('target'));
            }

            //Show warning if performance numbers are not supported in browser
            if(performance==undefined){
                let w=document.getElementById('warning');
                w.classList.remove('d-none');
                w.innerText="Your browser does not support all the features required to measure performance correctly";
            }


            function setFormValues(target,users,requests){
                if(target){
                    document.getElementById('target').value=target;
                }
                if(users){
                    document.getElementById('threads').value=users;
                    document.getElementById('threadNo').innerText=users;
                }
                if(requests){
                    document.getElementById('reqgoal').value=requests;
                    document.getElementById('reqNo').innerText=requests;
                }
            }

            function formatDate(date){
                
                let d=new Date(date);
                var datestring = d.getFullYear()  + "-" + (d.getMonth()+1).toString().padStart(2, '0')+"-"+d.getDate().toString().padStart(2, '0')   + " " +d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0')+ ":" + d.getSeconds().toString().padStart(2, '0');
                return datestring;
            }

            function deleteEntry(tm){
                let itm=resultshistory.find(elem => elem.time==tm);
                if(!itm)return;
                let idx=resultshistory.indexOf(itm);
                resultshistory.splice(idx,1);
                localStorage.setItem('resultshistory', JSON.stringify(resultshistory));
                //TODO: If there are no more items from that target in resultshistory then remove from url history
                ShowHistory(document.getElementById('historyHeader').value);
            }

            function ShowHistory(currentUrl){
                let grouped = resultshistory.reduce(function (r, a) {
                    r[a.url] = r[a.url] || [];
                    r[a.url].push(a);
                    return r;
                }, Object.create(null));

                let hheader=document.getElementById('historyHeader');
                hheader.innerHTML='';
                (urlhistory).forEach(u => { 
                    hheader.appendChild(
                        Object.assign(
                            document.createElement('option'),
                            { value:u, selected:(u == currentUrl)}
                        )
                    ).innerText=u; 
                });

                let hbody=document.getElementById('historyBody');
                hbody.innerHTML="";
                if(!grouped[currentUrl]) return;
                (grouped[currentUrl].reverse()).forEach(r => {
                    hbody.innerHTML+=trowtemplate
                        .replace('#date#',formatDate(Date.parse(r.time)))
                        .replace('#rps#',r.rps)
                        .replace('#details#',r.threads+' users, '+r.reqgoal+' requests')
                        .replace('#min#',(r.timings) ? r.timings.min:"n/a")
                        .replace('#avg#',(r.timings) ? r.timings.avg:"n/a")
                        .replace('#median#',(r.timings) ? r.timings.med:"n/a")
                        .replace('#max#',(r.timings) ? r.timings.max:"n/a")
                        .replace('#target#',currentUrl)
                        .replace('#users#',r.threads)
                        .replace('#timeid#',r.time)
                        .replace('#requests#',r.reqgoal);
                        //.replace('#errors#',r.errors);
                });

                //Unhide history
                document.getElementById('resultspane').classList.remove('d-none');
            }


            function addTestResults(url,results){
                //results contain time, url, threads, req-per-minute, min, max, median
                //Add to urlhistory if it doesn't already exist there (and save to local storage) and to resulthistory
                if(!urlhistory.includes(url))  urlhistory.push(url);
                resultshistory.push(results);
                localStorage.setItem('urlhistory', JSON.stringify(urlhistory));
                localStorage.setItem('resultshistory', JSON.stringify(resultshistory));
                ShowHistory(url);
            }

            function resetModal(url){
                SetProgress(0,100);
                document.getElementById('spinner').style.display='block';
                document.getElementById('runModalLabel').innerText='Testing '+url;
                document.getElementById('stopBtn').disabled=false;
                document.getElementById('closeBtn').disabled=true;
                document.getElementById('results').style.display='none';
            }

            function calculate_load_times(skipcount) {
                const median = arr => {
                    const mid = Math.floor(arr.length / 2),
                    nums = [...arr].sort((a, b) => a - b);
                    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
                };
                const arrSum = arr => arr.reduce((a,b) => a + b, 0);
                // Check performance support
                if (performance === undefined) {
                    console.log("Unable to calculate load times - not supported in browser");
                    return;
                }

                // Get a list of "resource" performance entries
                const resources = performance.getEntriesByType("resource");
                if (resources === undefined || resources.length <= skipcount) {
                    console.log("Unable to Load Times: there are NO new `resource` performance records");
                    return;
                }
                console.log("Calculating load times");
                let times=[];
                for(let i=skipcount;i<resources.length;i++){
                    //Validate that it is a proper resource call to target
                    if(resources[i].initiatorType=='fetch' && !isNaN(resources[i].duration)){
                        times.push(Math.round(resources[i].duration));
                    }
                }
                console.log(times);
                let result = {
                    min: Math.min(...times),
                    max: Math.max(...times),
                    avg: Math.round(arrSum(times)/times.length),
                    med: Math.round(median(times))
                };
                console.log(result);
                return result;
            }

            function get_resource_count(){
                return performance.getEntriesByType("resource").length;
            }


            function SetProgress(val,max){
                let progress=document.getElementById('pbar');
                let pct=((val*100)/max);
                progress.style.width=pct+"%";
                progress.setAttribute('aria-valuenow',pct);
            }

            const runModal = document.getElementById('runModal');
            runModal.addEventListener('shown.bs.modal', () => {
                RunTest();
            });
            runModal.addEventListener('show.bs.modal', () => {
                resetModal('');
            });
            function hideModal() {
                const modal = bootstrap.Modal.getInstance(runModal);    
                modal.hide();
            }
            function showModal(){
                const modal = bootstrap.Modal.getInstance(runModal);    
                modal.show();
            }



            function RunTest(){
                const url=document.getElementById('target').value;
                localStorage.setItem('target',url);
                const threads=document.getElementById('threads').value;
                localStorage.setItem('threads',threads);
                const reqgoal=document.getElementById('reqgoal').value;
                localStorage.setItem('reqgoal',reqgoal);

                let totalreqs=0;
                let errors=0;
                let stopping=false;
                let rescount=get_resource_count();
                let controller = new AbortController();

                function done(){
                    let s2=new Date();
                    let dif=s2.getTime()-s1.getTime();
                    let rps = Math.round((totalreqs/(dif/1000))*100)/100;
                    let t=calculate_load_times(rescount);
                    addTestResults(url,{
                        url: url,
                        rps: rps,
                        threads: threads,
                        reqgoal: reqgoal,
                        timings: t,
                        time: new Date(),
                        errors: errors
                    });
                    document.getElementById('results').style.display='block';
                    document.getElementById('rps').innerText=rps;
                    document.getElementById('mintime').innerText=t.min;
                    document.getElementById('mediantime').innerText=t.med;
                    document.getElementById('avgtime').innerText=t.avg;
                    document.getElementById('maxtime').innerText=t.max;
                    // document.getElementById('errors').innerText=errors;

                    
                    document.getElementById('spinner').style.display='none';
                    document.getElementById('stopBtn').disabled=true;
                    document.getElementById('closeBtn').disabled=false;
                }

                function RecursiveFetch(){
                    const fetchReq = fetch(url, {mode: 'no-cors', cache: 'no-cache', signal: controller.signal})
                        .then((res) => {
                            let t=totalreqs++;
                            // if(!res.ok) errors++;
                            SetProgress(t,reqgoal);
                            //console.log(t+' done');
                            if(t>=reqgoal && !stopping){
                                stopping=true;
                                done();
                            } else if(!stopping) RecursiveFetch();
                            else console.log('Stopping '+totalreqs);
                        });
                    return fetchReq;
                }

                let runner=[];
                for(let i=0;i<threads;i++){
                    runner.push(RecursiveFetch());
                }

                //Start logic
                console.log('starter...');
                resetModal(url);
                document.getElementById('stopBtn').onclick=(e) => {
                    controller.abort();
                    hideModal();
                };
                


                //Track
                _paq.push(['trackEvent', 'Test', 'Run', threads+'/'+reqgoal]);


                let s1=new Date();
                const allData = Promise.all(runner);

                allData.then((res) => {
                    console.log('done with '+totalreqs);
                });
 
            }