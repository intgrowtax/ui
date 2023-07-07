let urlInputResponse, currencyResponse, countryListResponse, cyn, impCurrency;
let hsDetailsResponse, impcountryHSResponse, expcountryHSResponse, rulesResponse;
let getDutyResponse = saveDutyResponse = {}, inputData = other_params = {}, showSaveDutyDetails = "";
let importCountrySummary = exportCountrySummary = transportModeSummary = hscodeSummary = hscodeDescSummary = currencyDescSummary = null;
let cifValSummary = totalDutySummary = totalCostSummary = null;
// const hostname = "http://localhost:5555";
const hostname = "https://dutycalculator.cyclic.app";
const getDutyUrl = `${hostname}/api/dutyCalculator/getDuty`;
const saveDutyUrl = `${hostname}/api/dutyCalculator/getFTA`;
const countryUrl = `${hostname}/api/country/search`;


function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function loadData(cynLoad = true) {
    const impCountry = document.getElementById("import_country").value;
    const expCountryHtml = document.getElementById("export_countryList");
    let expList = "";
    countryListResponse && countryListResponse.length && countryListResponse.forEach(item => {
        if (item.label != impCountry) {
            expList += `<option value="${item.label}"> </option>`;
        }
    });
    expCountryHtml.innerHTML = expList;
    cynLoad && loadCurrency();
}

function displayCountryList(countryListResponse) {
    const impCountryHtml = document.getElementById("import_countryList");
    let impList = "";
    countryListResponse && countryListResponse.length && countryListResponse.forEach(item => {
        impList += `<option value="${item.label}"> </option>`;
    });
    impCountryHtml.innerHTML = impList;
}

function loadCountryList(callback) {
    fetch(countryUrl)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            }
            else {
                throw new Error("Could not reach the country ist API: " + response.statusText);
            }
        }).then(function (data) {
            countryListResponse = data;
            countryListResponse && displayCountryList(countryListResponse);
            callback();
        }).catch(function (error) {
            console.log("Error in countryList fetch ", error);
        });
}

function displayUserInputs(userInputFields) {
    const userHtml = document.getElementById("user_input");
    let userFields = "";
    userInputFields && userInputFields.length && userInputFields.forEach(attr => {
        let isRequired = attr.is_required ? "required" : "";
        let attrVal = attr.default || "";
        let type = attr.type ? attr.type : "none";
        userFields += "<div class='form-group col-sm-4'>";
        userFields += `<label for="${attr.field}" class="col col-form-label"> ${attr.label} `;
        if (attr.pre_fix) {
            userFields += `<span class="userinput-align">(in ${attr.pre_fix})</span>`;
        }
        userFields += `</label><div class="btn-group col">`;
        switch (type) {
            case "none":
            default:
                let inputType = attr.type == "number" ? attr.type : "text";
                userFields += `<input type="${inputType}" class="form-control form-control-lg" id="${attr.field}" placeholder="Enter value" ${isRequired} value="${attrVal}"> `;
                break;
            case "droplist":
                let list = attr.values;
                userFields += `<select class="form-control form-control-lg" id="${attr.field}">`;
                userFields += `<option>Select ${attr.label}</option>`;
                list && list.length && list.forEach(v => {
                    userFields += `<option value="${v.value}"> ${v.label} </option>`;
                });
                userFields += "</select>";
                break;
        }
        userFields += "</div></div>";
    });

    userHtml.innerHTML = userFields;
}

function getCountryId(countryName, returnVal = "value") {
    var obj = countryListResponse && countryListResponse.find(o => o.label == countryName || o.value == countryName);
    return obj && obj[returnVal];
}

function getUserInput() {
    let hscodeVal = document.getElementById("hscode").value;
    if (hscodeVal.length > 6) {
        const impCountry = document.getElementById("import_country").value;
        const expCountry = document.getElementById("export_country").value;
        const impCode = getCountryId(impCountry);
        const userInputUrl = `${hostname}/api/getUserInput?hs=${hscodeVal}&imp=${impCode}`;

        fetch(userInputUrl)
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Could not reach the userInput API: " + response.statusText);
                }
            }).then(function (data) {
                urlInputResponse = data;
                urlInputResponse && displayUserInputs(urlInputResponse);

            }).catch(function (error) {
                console.log("Error in urlInput fetch", error);
            });
    }

}

function displayCurrency() {
    const currencyHTML = document.getElementById("cyn");
    let cynData = "";
    currencyResponse.forEach(c => {
        cynData += `<option id=${c.currency}>${c.country}</option>`;
    });
    currencyHTML.innerHTML += cynData;
}

function loadCurrency() {
    try {
        const impCountry = getCountryId(document.getElementById("import_country").value);
        const currencyAPIUrl = `${hostname}/api/country/currency?imp=${impCountry}`;

        fetch(currencyAPIUrl)
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Could not reach the currency API: " + response.statusText);
                }
            }).then(function (data) {
                currencyResponse = data;
                currencyResponse && displayCurrency();
            }).catch(function (error) {
                console.log("Error occurred ", error);
            });

    }
    catch (e) {
        console.log("Error in Currency API => ", e);
    }
}

function currencyConvert(val) {
    let total = 0;
    currencyResponse.forEach(c => {
        if (c.country === cyn || c.currency === cyn) {
            total = val / c.value;
        }
    });
    return total && Math.floor(total) || 0;
}

function displayOriginRules() {
    let rulesHTML = document.getElementById("rules");
    let string = "";
    if (rulesResponse.length) {
        string = "<div><h3>Rules Of Origin </h3>";
        rulesResponse.forEach(r => {
            if (r && r.label && r.label.toLowerCase() != 'not applicable') {
                string += `<p><span class="rules-label"> ${r.label} : </span> ${r.value}</p>`;
            }
        });
        string += "</div>";
    }
    rulesHTML.innerHTML = string;
}

function getRulesOfOrigin() {
    try {
        let importCountry = inputData.import_country,
            exportCountry = inputData.export_country,
            hs = inputData.hscode;
        const rulesOfOriginUrl = `${hostname}/api/country/rules?hs=${hs}&imp=${importCountry}&exp=${exportCountry}`;

        fetch(rulesOfOriginUrl)
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Could not reach the origin rules API: " + response.statusText);
                }
            }).then(function (data) {
                rulesResponse = data;
                rulesResponse && displayOriginRules();
            }).catch(function (error) {
                console.log("Error occurred in origin rules api", error);
            });

    }
    catch (e) {
        console.log("Error in origin rules API => ", e);
    }
}

function displayGetDuty() {
    // var string = "<div>";
    cyn = cyn || getDutyResponse.cyn || "INR";
    let getdutyTotal = Math.floor(getDutyResponse.total + getDutyResponse.CIFVALUE);
    let cynConvertDutyTotal = currencyConvert(getdutyTotal);
    const impCountryLabel = getCountryId(inputData.import_country, "label");
    const expCountryLabel = getCountryId(inputData.export_country, "label");
    const getDutyFormEle = document.getElementById("getdutyForm");
    getDutyFormEle.style.visibility = "hidden";
    getDutyFormEle.style.display = "none";

    currencyResponse && currencyResponse.forEach(c => {
        if (c.unit == c.value) {
            impCurrency = c.currency;
        }
    });
    // getRulesOfOrigin();  to be called for FTA

    let formDetails = "";
    const exportCountryList = document.getElementById('export_list');
    const currencyList = document.getElementById('currencyList');
    formDetails += `<div class='row'><div class='col-sm-9 row'><div class='col-sm-4 form-group'><label for="export_country" class="col col-form-label">Exporting</label>${exportCountryList.innerHTML}</div>`;
    formDetails += `<div class='form-group col-sm-4'><label for="productValue" class="col col-form-label">Value of Product</label><input type='text' class='form-control form-control-lg' value='${inputData.CIFVALUE}' id='productValue'> </div>`;
    formDetails += `<div class='form-group col-sm-4'><label for="cyn" class="col col-form-label">Currency</label>${currencyList.innerHTML} </div></div>`;
    formDetails += `<div class='col-sm-3 row'>`;
    formDetails += `<div class='col-sm-6'><button class='btn btn-outline-primary btn-icon-text' id='callGetDuty' type='button' onclick='getDuty(event)'>Get Result</button></div>`;
    formDetails += `<div class='col-sm-6'><button class='btn btn-outline-primary btn-icon-text' id='showGetDutyForm' type='button' onclick='gotoForm("getdutyForm", "getdutyDetails")'>Modify</button></div></div></div>`;

    let expLabel = document.getElementById('export_country');
    document.querySelector('#export_countryList').value = expCountryLabel;

    console.log("-- Val --- ", expLabel.value);
    console.log(expLabel);
    document.getElementById('cyn').value = cyn;
    const showGetDutyDetails = document.getElementById("getdutyDetails");

    showGetDutyDetails.innerHTML = "";
    showGetDutyDetails.innerHTML += formDetails;

    let totalDuty = 0;
    const dutyDetailsDesc = getDutyResponse && getDutyResponse.dutyDetails || [];
    let line = "";
    if (dutyDetailsDesc.length > 0) {
        line += `<div class='row display-group duty-block'><div class='col-sm-9 row duty-table'>`;
        line += `<div class='col-sm-12'><table class="duty-details"><tr><th>Duty Details</th><th>Duty Rate</th><th>Duty Amount(in ${impCurrency})</th>`;
        line += impCurrency != cyn ? `<th>Duty Amount(in ${cyn})</th>` : "";
        line += "</tr>";

        dutyDetailsDesc.forEach(ele => {
            var getKey = Object.keys(ele).filter(e => e.match(/(_dd)$/))[0];
            var prefix = getKey.split("_dd")[0];
            line += `<tr><td>${ele[`${prefix}_dd`]}</td>`;
            line += `<td>${ele[`${prefix}_d`]}</td>`;
            line += `<td>${ele[`${prefix}_cl`] && Math.floor(ele[`${prefix}_cl`]) || 0}</td>`;
            line += impCurrency != cyn ? `<td>${ele[`${prefix}_cl`] && currencyConvert(ele[`${prefix}_cl`] || 0)}</td>` : "";

        });
        totalDuty = currencyConvert(getDutyResponse.total);
        line += `<tr><td colspan="2">Total Duty</td><td> ${Math.floor(getDutyResponse.total)} </td>`;
        line += impCurrency != cyn ? `<td> ${totalDuty} </td>` : "";
        line += "</tr></table></div>";
    }

    let string = `<div class='col-sm-12 display-group'>`;
    string += `<span class='duty-cost'>Landed Cost: ${getdutyTotal}  ${impCurrency}</span>`;
    string += impCurrency != cyn ? ` <span class='duty-costchange'>( ${cynConvertDutyTotal} ${cyn} )</span>` : "";
    string += `<div class='tnc-note'>*Excluding destination freight, destination charges and intermediaries margin (importer, wholesaler, etc.)</div>`;
    string += `</div></div>`;

    line += string;

    line += `<div class='col-sm-3 row getduty-summary'>`;
    line += `<div class='col-sm-12 summary-title'> YOUR SHIPMENT SUMMARY</div>`;
    line += `<div class='col-sm-6 summary-label'> Import Country: </div> <div class='col-sm-6 summary-value'> ${impCountryLabel} </div>`;
    line += `<div class='col-sm-6 summary-label'> Export Country: </div> <div class='col-sm-6 summary-value'> ${expCountryLabel} </div>`;
    line += `<div class='col-sm-6 summary-label'> Mode of Transport: </div> <div class='col-sm-6 summary-value'> ${inputData.mode} </div>`;
    line += `<div class='col-sm-6 summary-label'> Import HSN: </div> <div class='col-sm-6 summary-value'> ${getDutyResponse.hscode} </div>`;
    line += `<div class='col-sm-6 summary-label'> Currency: </div> <div class='col-sm-6 summary-value'> ${cyn} </div>`;
    line += `<div class='col-sm-6 summary-label'> CIF Value: </div> <div class='col-sm-6 summary-value'> ${getDutyResponse.CIFVALUE} </div>`;
    line += `<div class='col-sm-6 summary-label'> Total Duty: </div> <div class='col-sm-6 summary-value'> ${totalDuty} ${cyn}</div>`;
    line += `<div class='col-sm-6 summary-label'> Total Landed Cost: </div> <div class='col-sm-6 summary-value'> ${getdutyTotal}  ${cyn}</div>`;
    line += `<div class='col-sm-6 summary-label'> HSN Description: </div> <div class='col-sm-12'> ${getDutyResponse.des} </div>`;
    line += `</div>`;

    showGetDutyDetails.innerHTML += line;

    showGetDutyDetails.style.visibility = "visible";
    showGetDutyDetails.style.display = 'inline-block';

}

function formRequest() {
    //summary block
    importCountrySummary = document.getElementById('import_name_summary');
    exportCountrySummary = document.getElementById('export_name_summary');
    transportModeSummary = document.getElementById('transport_mode_summary');
    hscodeSummary = document.getElementById('hscode_val_summary');
    hscodeDescSummary = document.getElementById('hscode_desc_summary');
    currencyDescSummary = document.getElementById('currecny_summary');
    cifValSummary = document.getElementById('cif_val_summary');
    totalDutySummary = document.getElementById('total_duty_summary');
    totalCostSummary = document.getElementById('total_cost_summary');

    var params = {};
    var y = document.getElementById("myForm");
    for (var i = 0; i < y.elements.length; i++) {
        var fieldName = y.elements[i].id;
        var fieldValue = y.elements[i].value;

        if (fieldName != "formsubmit") { params[fieldName] = getCountryId(fieldValue) || fieldValue; }
    }
    console.log("---params --- ", params);
    var exwValue = cifValue = fobValue = 0;
    var originCharges = parseFloat(params.originCharges) || 0,
        exwInsuranceCharges = parseFloat(params.exwInsuranceCharges) || 0,
        cifInsuranceCharges = parseFloat(params.cifInsuranceCharges) || 0,
        fobInsuranceCharges = parseFloat(params.fobInsuranceCharges) || 0,

        exwIntFreight = parseFloat(params.exwIntFreight) || 0,
        cifIntFreight = parseFloat(params.cifIntFreight) || 0,
        fobIntFreight = parseFloat(params.fobIntFreight) || 0,


        originFreight = parseFloat(params.originFreight) || 0,
        productVal = parseFloat(params.productValue) || 0;


    switch (params['inco_term']) {
        case 'EXW':
            exwValue = productVal;
            fobValue = exwValue + originCharges + originFreight;
            cifValue = fobValue + exwIntFreight + exwInsuranceCharges;
            break;
        case 'CIF':
            cifValue = productVal;
            fobValue = cifValue - (cifIntFreight + cifInsuranceCharges);
            exwValue = cifValue - (originCharges + originFreight + cifIntFreight + cifInsuranceCharges);
            break;
        case 'FOB':
            fobValue = productVal;
            cifValue = fobValue + (fobIntFreight + fobInsuranceCharges);
            exwValue = fobValue - (fobIntFreight + fobInsuranceCharges);
    }

    params["CIFVALUE"] = cifValue;
    params["FOBVALUE"] = fobValue;
    cyn = params.cyn;
    otherData = {};

    urlInputResponse && urlInputResponse.forEach(val => {
        otherData[val.field] = val.type == "number" ? parseFloat(params[val.field]) : params[val.field];
    });

    inputData = {
        hscode: params.hscode,
        import_country: params.import_country,
        export_country: params.export_country,
        CIFVALUE: params["CIFVALUE"],
        FOBVALUE: params["FOBVALUE"],
        mode: params.mode,
        ...otherData
    };

    other_params = {
        headers: {
            "Content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Origin": "localhost:3000",
            "Authorization": "Bearer EAALlsF27TkEBAPFq6ow61SOkPt3Gg1LqAlkKtoZCsFPP3q3KkOgmXqiDpDyyeMAwxJbTB3k56bkliVcXvXjoZC0GcIMpIEXDjgDf3UGgT4USdVPu1SbVQMHJbssuvjZA5mLhJemWfnttFXRtfuUv5PiaZAeZAB7ZBWql4JCZBAhE71QalEqi78vUFZA5ILIFfv0vAbXFmAM8TkdaKsvvOqCzcZAlUYqXj4T0ZD",
            "x-access-token": "EAALlsF27TkEBAPFq6ow61SOkPt3Gg1LqAlkKtoZCsFPP3q3KkOgmXqiDpDyyeMAwxJbTB3k56bkliVcXvXjoZC0GcIMpIEXDjgDf3UGgT4USdVPu1SbVQMHJbssuvjZA5mLhJemWfnttFXRtfuUv5PiaZAeZAB7ZBWql4JCZBAhE71QalEqi78vUFZA5ILIFfv0vAbXFmAM8TkdaKsvvOqCzcZAlUYqXj4T0ZD"
        },
        body: JSON.stringify(inputData),
        method: "POST",
    };
}

async function getDuty(event) {
    event.preventDefault();

    formRequest();

    fetch(getDutyUrl, other_params)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Could not reach the API: " + response.statusText);
            }
        }).then(function (data) {
            getDutyResponse = data;
            getDutyResponse && displayGetDuty();
        }).catch(function (error) {
            console.log('Error in getDuty ', error);
        });
    return true;
}

function displaySaveDuty() {
    const showSummary = document.getElementById("summary");
    showSaveDutyDetails = document.getElementById("savedutyDetails");
    showSaveDutyDetails.innerHTML = " ";
    let entry = "", savedDutyDetails = [], ftaRule = "";
    const getDutyTotal = getDutyResponse && (getDutyResponse.CIFVALUE + getDutyResponse.total);
    let importCountry = inputData.import_country,
        exportCountry = inputData.export_country;
    saveDutyResponse && saveDutyResponse.length && saveDutyResponse.forEach(duty => {
        var dutyDetailsDesc = duty && duty[0] && duty[0].dutyDetails || [];
        var total = Math.floor(duty[0].total + duty[0].CIFVALUE);
        let cynConvertTotal = currencyConvert(total);
        if (dutyDetailsDesc.length > 0) {
            var line = `<table class='duty-details'><tr><th>Duty Details</th><th>Duty Rate</th><th>Duty Amount(in ${impCurrency})</th>`;
            line += impCurrency != cyn ? `<th>Duty Amount(in ${cyn})</th>` : "";
            line += "</tr>";
            entry = "", dutyCodes = [];
            dutyDetailsDesc.forEach(ele => {
                var getKey = Object.keys(ele).filter(e => e.match(/(_dd)$/))[0].match(/(^((?!mfn).)*$)/);
                getKey = getKey && getKey[0];
                if (getKey) {
                    var prefix = getKey.split("_dd")[0];
                    var _dd = ele[`${prefix}_dd`],
                        _d = ele[`${prefix}_d`] || 0,
                        _cl = ele[`${prefix}_cl`] || 0;
                    ftaRule = !ftaRule ? _dd : ftaRule;
                    entry += `<tr><td>${_dd}</td>`;
                    entry += `<td>${_d}</td>`;
                    entry += `<td>${Math.floor(_cl)}</td>`;
                    entry += impCurrency != cyn ? `<td>${currencyConvert(_cl)}</td>` : "";
                    dutyCodes.push(ele[getKey]);
                }
            });
            let key = Object.keys(duty[0].dutyDetails[1]).filter(o => o.includes('_dd'));
            savedDutyDetails.push({
                total: total,
                cyn: cyn,
                code: duty[0].dutyDetails[1][key]
            });
            let dutyTotal = duty[0].total ? Math.floor(duty[0].total) : 0;
            let totalPrecision = impCurrency != cyn && currencyConvert(dutyTotal);
            let htmlText = line + entry + `<tr><td colspan="2">Total Duty</td><td> ${dutyTotal} </td>`;
            htmlText += impCurrency != cyn ? `<td> ${totalPrecision} </td>` : "";
            showSaveDutyDetails.innerHTML += `${htmlText} </tr></table>`;
        }

        var string = "<div>";
        let savedAmt = "Congratulation you have saved " + Math.floor(total - getDutyTotal) + " " + impCurrency + " in above transaction if imported under " + ftaRule;
        string += "<h3>Landed cost: " + total + " " + impCurrency;
        string += impCurrency != cyn ? ` ( ${cynConvertTotal} ${cyn} )</h3>` : "";
        string += "</div><div class='row'> <div class='tnc-note'><i>*Excluding destination freight, destination charges and intermediaries margin (importer, wholesaler, etc.) </i></div>";
        string += `<div><img class="thumbs-up-icon" src="images/thumbs-up.png" alt="success">${savedAmt}</div>`;
        showSaveDutyDetails.innerHTML += string;
        ftaRule = "";

    });
    importCountrySummary.innerHTML = getCountryId(importCountry, "label");
    exportCountrySummary.innerHTML = getCountryId(exportCountry, "label");

    let importCountryName = getCountryId(importCountry, "label"),
        exportCountryName = getCountryId(exportCountry, "label");

    var summaryBlock = "";
    summaryBlock += "<div><h3>Your Shipment Summary</h3>";
    summaryBlock += `<div>Import Country: ${importCountryName}</div>`;
    summaryBlock += `<div>Export Country: ${exportCountryName}</div>`;
    summaryBlock += `<div>Mode Of Transport: ${inputData.mode} </div>`;
    summaryBlock += `<div>Import HS code: ${inputData.hscode}</div>`;
    summaryBlock += `<div>Currency: ${cyn}</div>`;
    summaryBlock += `<div>CIF Value: ${inputData.CIFVALUE}</div>`;

    var details = "<ol type='1'>";
    savedDutyDetails && savedDutyDetails.forEach(block => {
        let dutyTotal = block.total + saveDutyResponse[0][0].CIFVALUE;
        let cynConvertTotal = currencyConvert(dutyTotal);
        details += "<li><div>Total landed cost: " + dutyTotal + " " + impCurrency;
        details += impCurrency != cyn ? ` ( ${cynConvertTotal} ${cyn} )` : "";
        details += "</div><div>Duty Saved: " + currencyConvert(getDutyTotal - dutyTotal) + " " + cyn + " (" + block.code + ")</div></li>"
    });
    details += "</ol>";
    showSummary.innerHTML = summaryBlock + details;
    showSummary.style.visibility = "visible";
    showSummary.style.display = 'inline-block';
}

async function getSavedDuty(event) {
    event.preventDefault();
    formRequest();

    fetch(getDutyUrl, other_params)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Could not reach the API: " + response.statusText);
            }
        }).then(function (data) {
            getDutyResponse = data;
            getDutyResponse && displayGetDuty();

            fetch(saveDutyUrl, other_params)
                .then(function (response) {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error("Could not reach the API: " + response.statusText);
                    }
                }).then(function (data) {
                    saveDutyResponse = data;
                    saveDutyResponse && displaySaveDuty();

                }).catch(function (error) {
                    showSaveDutyDetails.innerHTML = error;
                });
        }).catch(function (error) {
            document.getElementById("message").innerHTML = error;
        });

    var showToggle = document.getElementById("toggleDuty");
    showToggle.style.visibility = "visible";
    showToggle.style.display = 'inline-block';
}

function displayHSCodes(ele) {
    let hsArray = [], hsDataList = "", unique = [];

    hsDetailsResponse && hsDetailsResponse.forEach(h => {
        hsDataList += `<option>${h.hs6}</option>`;
    });

    document.getElementById("hscodeList").innerHTML = hsDataList;
}

function searchHSCode() {
    let hscode = document.getElementById("hscode").value,
        impCountry = document.getElementById("import_country").value,
        string = '';
    document.getElementById('popup-box').style.visibility = "visible";
    document.getElementById('popup-box').style.opacity = "1";
    document.getElementById('popup-box').style.display = "flex";

    let searchHSForm = document.getElementById("searchHSN");
    if (!impCountry) {
        string = `<div class='row'><span> Select import country to continue</span></div>`;
    }
    else
        if (impCountry) {
            string = `<div class="row modal-body"> `;
            string += `<div class="col col-sm-9"><input type="text" class="form-control form-control-lg" id="search-hscode" list="hscodeList" placeholder="Enter product name or HS code here..." aria-label="search"></div>`;
            string += `<button id="hscodesubmit" type="button" class="btn btn-outline-primary btn-icon-text btn-center-align col-sm-3 modal-btn" onclick="getHSNSearch('${impCountry}', 'hs_search_result')"> Get Result</button>`;
            string += `<div class="col-sm-12" id="hs_search_result"></div> </div></div>`;
        }

    searchHSForm.innerHTML = string;
}

function closeModal() {
    document.getElementById('popup-box').style.visibility = "hidden";
}

function findHSCode(ele = '') {
    ele = document.getElementById("hscode").value;
    if ((ele.match(/^[0-9]+$/g) && ele.length > 1 && ele.length % 2 == 0) || (ele.match(/[a-zA-Z]+/g) && ele.length > 2)) {
        const hsDetailsUrl = `${hostname}/api/hs_code/details?hs=${ele}`;
        fetch(hsDetailsUrl)
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                }
            }).then(function (data) {
                hsDetailsResponse = data;
                hsDetailsResponse && displayHSCodes(ele);
            }).catch(function (error) {
                console.log("Error in HS Code details fetch, ", error);
            });
    }
}

function storeHSValue(element, importCountry, exportCountry) {
    const impHSN = document.getElementById('imp_hscode'),
        expHSN = document.getElementById('exp_hscode');

    if (impHSN || element) {
        element ? localStorage.setItem("hscode", element) : localStorage.setItem("hscode", impHSN.value);
        localStorage.setItem("imp", getCountryId(importCountry, "label"));
        localStorage.setItem("exp", getCountryId(exportCountry, "label"));
    }
    else if (expHSN) {
        localStorage.setItem("hscode", expHSN.value);
        localStorage.setItem("exp", getCountryId(importCountry, "label"));
        localStorage.setItem("imp", getCountryId(exportCountry, "label"));
    }

    window.location.href = "index.html";
}

function enableBtn(element) {
    let impHSN = document.getElementById("imp_hscode"),
        expHSN = document.getElementById("exp_hscode");
    if (impHSN.checked && expHSN.checked) {
        document.getElementById(element).disabled = false;
    }
}

function displayHSTable(hscodesDisplay, impHSMap, expHSMap, importCountry, exportCountry) {
    let hscodeHTML = "", imp_hsn, exp_hsn;
    if (impHSMap && impHSMap.length) {
        hscodeHTML = "<div class='row hstable-row'><div class='col-sm-6 hstable'>";
        hscodeHTML += `<div class="hstable-body"><div class="hstable-title"> <span>HS Codes for ${getCountryId(importCountry, "label")} </span></div>`;
        hscodeHTML += `<table class="hstable-data"><tr> <th> HSN </th> <th colspan='2'> Product Description </th> </tr>`
        impHSMap.forEach(d => {
            hscodeHTML += `<tr> <td> ${d.value} </td> <td> ${d.label} </td><td><input type="radio" value="${d.value}" name="impHSCode" id="imp_hscode" onchange="enableBtn('store_val')"></td></tr>`;
        });
        hscodeHTML += "</table></div></div>";
        imp_hsn = document.getElementById('imp_hscode');
    }
    if (expHSMap && expHSMap.length) {
        hscodeHTML += "<div class='col-sm-6 hstable'>";
        hscodeHTML += `<div class="hstable-body"><div class="hstable-title"> <span>HS Codes for ${getCountryId(exportCountry, "label")} </span></div>`;
        hscodeHTML += `<table class="hstable-data"><tr> <th> HSN </th> <th colspan='2'> Product Description </th> </tr>`
        expHSMap.forEach(d => {
            hscodeHTML += `<tr> <td> ${d.value} </td> <td> ${d.label} </td><td><input type="radio" value="${d.value}" name="expHSCode" id="exp_hscode" onchange="enableBtn('store_val')"></td></tr>`;
        });
        hscodeHTML += "</table></div></div>";
        exp_hsn = document.getElementById('exp_hscode');
    }
    hscodeHTML += `<button id="store_val" class="btn btn-outline-primary btn-icon-text hstable-btn" onclick=storeHSValue(${imp_hsn},"${importCountry}","${exportCountry}") disabled> Proceed to Import Duty Calculator</button></div>`;
    hscodesDisplay.innerHTML += hscodeHTML;
}

function gotoForm(element1, element2) {
    let formReset = document.getElementById(element2),
        formDisplay = document.getElementById(element1);
    formReset.innerHTML = '';
    formDisplay.style.visibility = 'visible';
    formDisplay.style.display = 'flex';
}

async function fetchCountryHSN(hscode, importCountry, ele) {
    const countryHSUrl = `${hostname}/api/getProductFromCountryCode?hs=${hscode}&imp=${importCountry}`;
    impcountryHSResponse = await fetch(countryHSUrl);
    if (!impcountryHSResponse.ok) {
        const msg = `Error in fetch ${impcountryHSResponse.status}`;
        throw new Error(msg);
    }
    const impHSMap = impcountryHSResponse.status != 204 ? await impcountryHSResponse.json() : [];
    displayHSTable(ele, impHSMap, "", importCountry, "");
}



async function getHSNSearch(importCountry, searchHSFormEle) {
    let hscode = document.getElementById('search-hscode').value;
    importCountry = getCountryId(importCountry);
    if (hscode.length > 2 && hscode.length < 7) {
        const hsSearchsUrl = `${hostname}/api/hsCountrySearch?hs=${hscode}&imp=${importCountry}`;

        fetch(hsSearchsUrl)
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                }
            }).then(function (data) {
                data && showHSSearch(data, importCountry, searchHSFormEle);
            }).catch(function (error) {
                console.log("Error in HS Code details fetch, ", error);
            });
    }
    else {
        console.log(" Invalid input ");
        // fetchCountryHSN(hscode, importCountry, searchHSFormEle);
    }

}


async function getCountryHSCode(hscode, importCountry, exportCountry) {
    let hscodeForm = document.getElementById("hscode_form"),
        hsFreeTextTable = document.getElementById("hs_freetext_search"),
        hscodesDisplay = document.getElementById("show_hscodes");
    hscodeForm.style.visibility = hsFreeTextTable.style.visibility = 'hidden';
    hscodeForm.style.display = hsFreeTextTable.style.display = 'none';
    let formDetails = "";
    formDetails += `<div class='row hstable-form'><div class='col-sm-4'><span class='col-hs col-form-label'>Product Name/HS Code</span><input type='text' class='form-control form-control-lg' value='${hscode}'></div>`;
    formDetails += `<div class='col-sm-3'><span class='col-hs col-form-label'>Importing Country</span><input type='text' class='form-control form-control-lg' value='${importCountry}'> </div>`;
    formDetails += `<div class='col-sm-3'><span class='col-hs col-form-label'>Exporting Country</span><input type='text' class='form-control form-control-lg' value='${exportCountry}'> </div>`;
    formDetails += `<div class='col-sm-1'><button class='btn btn-outline-primary btn-icon-text' id='modifyHS' type='button' onclick='gotoForm("hscode_form", "show_hscodes")'>Modify</button></div>`
    hscodesDisplay.innerHTML = formDetails;
    importCountry = importCountry && getCountryId(importCountry);
    exportCountry = exportCountry && getCountryId(exportCountry);
    hscode = hscode.split(" ")[0];

    const countryHSUrl = `${hostname}/api/getProductFromCountryCode?hs=${hscode}&imp=`;
    const impUrl = countryHSUrl + importCountry;
    const expUrl = countryHSUrl + exportCountry;

    impcountryHSResponse = await fetch(impUrl);
    expcountryHSResponse = await fetch(expUrl);

    if (!impcountryHSResponse.ok) {
        const msg = `Error in fetch ${impcountryHSResponse.status}`;
        throw new Error(msg);
    }
    if (!expcountryHSResponse.ok) {
        const msg = `Error in fetch ${expcountryHSResponse.status}`;
        throw new Error(msg);
    }

    const impHSMap = impcountryHSResponse.status != 204 ? await impcountryHSResponse.json() : [];
    const expHSMap = expcountryHSResponse.status != 204 ? await expcountryHSResponse.json() : [];

    displayHSTable(hscodesDisplay, impHSMap, expHSMap, importCountry, exportCountry);
}

function fillHSNSearch(hscode) {
    document.getElementById('hscode').value = hscode;
    document.getElementById('popup-box').style.visibility = "hidden";
    document.getElementById('popup-box').style.opacity = "0";
    document.getElementById('popup-box').style.display = "none";
    getUserInput();

}

async function getCountryHSSearch(hscode, imp, formEle) {
    let hscodesDisplay = document.getElementById(formEle);
    const countryHSUrl = `${hostname}/api/getProductFromCountryCode?hs=${hscode}&imp=${imp}`;
    impcountryHSResponse = await fetch(countryHSUrl);
    if (!impcountryHSResponse.ok) {
        const msg = `Error in fetch ${impcountryHSResponse.status}`;
        throw new Error(msg);
    }
    const impHSMap = impcountryHSResponse.status != 204 ? await impcountryHSResponse.json() : [];
    let hscodeHTML = "", imp_hsn;
    if (impHSMap && impHSMap.length) {
        hscodeHTML = "<div class='row hstable-row'><div class='col-sm-12 hstable'>";
        hscodeHTML += `<div class="hstable-body"><div class="hstable-title"> <span>HS Codes for ${getCountryId(imp, "label")} </span></div>`;
        hscodeHTML += `<table class="hstable-data"><tr> <th> HSN </th> <th colspan='2'> Product Description </th> </tr>`
        impHSMap.forEach(d => {
            hscodeHTML += `<tr> <td> ${d.value} </td> <td> ${d.label} </td><td><input type="radio" value="${d.value}" name="impHSCode" id="imp_hscode" onclick="fillHSNSearch(this.value)"></td></tr>`;
        });
        hscodeHTML += "</table></div></div>";
        imp_hsn = document.getElementById('imp_hscode');
        hscodesDisplay.innerHTML = hscodeHTML;
    }
}

function showHSSearch(hscode, importCountry, formEle) {
    let string = '';
    let hsFreeTextTable = document.getElementById(formEle);
    string = "<div class='row hstable-row justify-content-center'><div class='col-sm-11 hstable'>";
    string += `<div class="hsfree-text-body">`;
    string += `<table class="hstable-data"><tr> <th colspan="2"> HSN </th> </tr>`;
    hscode.forEach(h => {
        string += `<tr> <td> ${h.hs6} </td> <td><input type="radio" value="${h.hsn}" onclick='getCountryHSSearch("${h.hsn}","${importCountry}","${formEle}")' name="HSCode" id="hscode_select"></td></tr>`;
    });
    string += "</table></div></div></div>";
    hsFreeTextTable.innerHTML = string;
    hsFreeTextTable.style.visibility = 'visible';
    hsFreeTextTable.style.display = 'flex';
}

function displayFreeHSSearch(hs_codes, importCountry, exportCountry, formEle = "hs_freetext_search") {
    let string = '';
    let hsFreeTextTable = document.getElementById(formEle);
    string = "<div class='row hstable-row justify-content-center'><div class='col-sm-11 hstable'>";
    string += `<div class="hsfree-text-body">`;
    string += `<table class="hstable-data"><tr> <th colspan="2"> HSN </th> </tr>`;
    hs_codes.forEach(h => {
        let value = h.hs6.split(" -")[0];
        string += `<tr> <td> ${h.hs6} </td> <td><input type="radio" value="${value}" onclick='getCountryHSCode("${h.hs6}","${importCountry}","${exportCountry}")' name="HSCode" id="hscode_select"></td></tr>`;
    });
    string += "</table></div></div></div>";
    hsFreeTextTable.innerHTML = string;
    hsFreeTextTable.style.visibility = 'visible';
    hsFreeTextTable.style.display = 'flex';
}

async function loadHsCodes(event) {
    event.preventDefault();
    window.localStorage.removeItem("hscode");
    window.localStorage.removeItem("imp");
    window.localStorage.removeItem("exp");
    let importCountry = document.getElementById("import_country").value,
        exportCountry = document.getElementById("export_country").value,
        hscode = document.getElementById("hscode").value;

    if (hscode && hscode.match(/^([a-zA-Z]+)/g)) {
        findHSCode(hscode);
        displayFreeHSSearch(hsDetailsResponse, importCountry, exportCountry);
    }
    else {
        getCountryHSCode(hscode, importCountry, exportCountry);
    }

}

function formPrefilledData() {
    let hscode = window.localStorage.getItem("hscode"),
        impCountry = window.localStorage.getItem("imp"),
        expCountry = window.localStorage.getItem("exp");
    let hscodeElement = document.getElementById("hscode"),
        impCountryElement = document.getElementById("import_country"),
        expCountryElement = document.getElementById("export_country");

    if (impCountry && impCountryElement && countryListResponse) {
        impCountryElement.value = impCountry;
        loadCurrency();

        if (hscode && hscodeElement) {
            hscodeElement.value = hscode;
            getUserInput();
        }
    }

    if (expCountry && expCountryElement) {
        expCountryElement.value = expCountry;
    }
} 
