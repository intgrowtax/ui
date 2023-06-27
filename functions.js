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

function loadCountryList() {
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
        userFields += "<div class='form-group col-sm-6'>";
        userFields += `<label for="${attr.field}" class="col col-form-label"> ${attr.label} </label>`;
        userFields += `<div class="btn-group col">`;
        switch (type) {
            case "none":
            default:
                let inputType = attr.type == "number" ? attr.type : "text";
                userFields += `<input type="${attr.type}" class="form-control form-control-lg" id="${attr.field}" placeholder="Enter value" ${isRequired} value="${attrVal}"> <span class="userinput-align">${attr.pre_fix}</span>`;
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
    return total && total.toFixed(2) || 0;
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
    var string = "<div>";
    cyn = getDutyResponse.cyn || cyn || "INR";
    let getdutyTotal = (getDutyResponse.total + getDutyResponse.CIFVALUE).toFixed(2);
    let cynConvertDutyTotal = currencyConvert(getdutyTotal);

    currencyResponse && currencyResponse.forEach(c => {
        if (c.unit == c.value) {
            impCurrency = c.currency;
        }
    });
    getRulesOfOrigin();

    string += "<h3>Landed cost: " + getdutyTotal + " " + impCurrency;
    string += impCurrency != cyn ? ` ( ${cynConvertDutyTotal} ${cyn} )</h3>` : "";
    string += "</div><div class='row'> <div class='tnc-note'><i>*Excluding destination freight, destination charges and intermediaries margin (importer, wholesaler, etc.) </i></div> </div>";
    document.getElementById("message").innerHTML = string;

    const showGetDutyDetails = document.getElementById("getdutyDetails");
    const showGetDutySummary = document.getElementById("getdutySummary");

    showGetDutyDetails.innerHTML = "";
    let importCountry = inputData.import_country,
        exportCountry = inputData.export_country;
    let totalDuty = 0;



    const dutyDetailsDesc = getDutyResponse && getDutyResponse.dutyDetails || [];
    if (dutyDetailsDesc.length > 0) {
        var line = `<tr><th>Duty Details</th><th>Duty Rate</th><th>Duty Amount(in ${impCurrency})</th>`;
        line += impCurrency != cyn ? `<th>Duty Amount(in ${cyn})</th>` : "";
        line += "</tr>";
        showGetDutyDetails.innerHTML = line;
        dutyDetailsDesc.forEach(ele => {
            var getKey = Object.keys(ele).filter(e => e.match(/(_dd)$/))[0];
            var prefix = getKey.split("_dd")[0];
            var entry = `<tr><td>${ele[`${prefix}_dd`]}</td>`;
            entry += `<td>${ele[`${prefix}_d`]}</td>`;
            entry += `<td>${ele[`${prefix}_cl`] && ele[`${prefix}_cl`].toFixed(2) || 0}</td>`;
            entry += impCurrency != cyn ? `<td>${ele[`${prefix}_cl`] && currencyConvert(ele[`${prefix}_cl`] || 0)}</td>` : "";
            showGetDutyDetails.innerHTML += entry;
        });
        totalDuty = currencyConvert(getDutyResponse.total);
        let totalCol = `<tr><td colspan="2">Total Duty</td><td> ${getDutyResponse.total.toFixed(2)} </td>`;
        totalCol += impCurrency != cyn ? `<td> ${totalDuty} </td>` : "";
        totalCol += "</tr>";
        showGetDutyDetails.innerHTML += totalCol;
    }

    importCountrySummary.innerHTML = getCountryId(importCountry, "label");
    exportCountrySummary.innerHTML = getCountryId(exportCountry, "label");
    transportModeSummary.innerHTML = inputData.mode;
    hscodeSummary.innerHTML = getDutyResponse.hs || getDutyResponse.hscode;
    hscodeDescSummary.innerHTML = getDutyResponse.des || "";
    currencyDescSummary.innerHTML = cyn;
    cifValSummary.innerHTML = getDutyResponse.CIFVALUE || inputData.CIFVALUE;
    totalDutySummary.innerHTML = totalDuty + " " + cyn;
    totalCostSummary.innerHTML = getdutyTotal + " " + cyn;

    showGetDutyDetails.style.visibility = showGetDutySummary.style.visibility = "visible";
    showGetDutyDetails.style.display = showGetDutySummary.style.display = 'inline-block';

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
    document.getElementById('message').innerHTML = "checking";

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
            document.getElementById("message").innerHTML = error;
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
        var total = (duty[0].total + duty[0].CIFVALUE).toFixed(2);
        let cynConvertTotal = currencyConvert(total);
        if (dutyDetailsDesc.length > 0) {
            var line = `<table class='duty-details'><tr><th>Duty Details</th><th>Duty Rate</th><th>Duty Amount(in ${impCurrency})</th>`;
            line += impCurrency != cyn ? `<th>Duty Amount(in ${cyn})</th>`: "";
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
                    entry += `<td>${_cl.toFixed(2)}</td>`;
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
            let dutyTotal = duty[0].total ? (duty[0].total).toFixed(2) : 0;
            let totalPrecision = impCurrency != cyn && currencyConvert(dutyTotal);
            let htmlText = line + entry + `<tr><td colspan="2">Total Duty</td><td> ${dutyTotal} </td>`;
            htmlText += impCurrency != cyn ? `<td> ${totalPrecision} </td>`: "";
            showSaveDutyDetails.innerHTML += `${htmlText} </tr></table>`;
        }

        var string = "<div>";
        let savedAmt = "Congratulation you have saved " + (total - getDutyTotal).toFixed(2) + " " + impCurrency + " in above transaction if imported under " + ftaRule;
        string += "<h3>Landed cost: " + total + " " + impCurrency;
        string += impCurrency != cyn ? ` ( ${cynConvertTotal} ${cyn} )</h3>`: "";
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
        details += impCurrency != cyn ? ` ( ${cynConvertTotal} ${cyn} )`: "";
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
    // if (ele.match(/^[0-9]+$/g)) {
    //     unique = hsArray = [];
    //     hsDetailsResponse.forEach(d => {
    //         let regEx = new RegExp("^(" + ele + ").*", "g");
    //         let key = Object.keys(d).filter(val => d[val].match(regEx));
    //         if (key) {
    //             key.forEach(entry => {
    //                 hsArray.push(d[entry]);
    //             });
    //         }
    //     });
    // }
    // else {
    //     unique = hsArray = [];
    //     hsArray.push(hsDetailsResponse[0].hs2);
    //     hsDetailsResponse.forEach(d => {
    //         hsArray.push(d.hs6);
    //         hsArray.push(d.hs4);
    //     });
    // }
    // unique = [...new Set(hsArray)];
    // console.log("---unique => ", unique);
    hsDetailsResponse && hsDetailsResponse.forEach(h => {
        hsDataList += `<option>${h.hs6}</option>`;
    });

    document.getElementById("hscodeList").innerHTML = hsDataList;
}

function findHSCode() {
    let ele = document.getElementById("hscode").value;
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
    localStorage.setItem("hscode", element);
    localStorage.setItem("imp", getCountryId(importCountry, "label"));
    localStorage.setItem("exp", getCountryId(exportCountry, "label"));
    window.location.href = "index.html";
}

function displayHSTable(hscodesDisplay, impHSMap, expHSMap, importCountry, exportCountry) {
    let hscodeHTML = "",imp_hsn, exp_hsn;
    if (impHSMap && impHSMap.length) {
        hscodeHTML = "<div class='row hstable-row'><div class='col-sm-6 hstable'>";
        hscodeHTML += `<div class="hstable-body"><div class="hstable-title"> <span>HS Codes for ${getCountryId(importCountry, "label")} </span></div>`;
        hscodeHTML += `<table class="hstable-data"><tr> <th> HSN </th> <th colspan='2'> Product Description </th> </tr>`
        impHSMap.forEach(d => {
            hscodeHTML += `<tr> <td> ${d.value}</button> </td> <td> ${d.label} </td><td><input type="radio" value="${d.value}" name="impHSCode" id="imp_hscode"></td></tr>`;
        });
        hscodeHTML += "</table></div></div>";
        imp_hsn = document.getElementById('imp_hscode');
    }
    if (expHSMap && expHSMap.length) {
        hscodeHTML += "<div class='col-sm-6 hstable'>";
        hscodeHTML += `<div class="hstable-body"><div class="hstable-title"> <span>HS Codes for ${getCountryId(exportCountry, "label")} </span></div>`;
        hscodeHTML += `<table class="hstable-data"><tr> <th> HSN </th> <th colspan='2'> Product Description </th> </tr>`
        expHSMap.forEach(d => {
            hscodeHTML += `<tr> <td> ${d.value}</button> </td> <td> ${d.label} </td><td><input type="radio" value="${d.value}" name="expHSCode" id="exp_hscode"></td></tr>`;
        });
        hscodeHTML += "</table></div></div>";
        exp_hsn = document.getElementById('exp_hscode');
    }
    hscodeHTML += `<button class="btn btn-outline-primary btn-icon-text hstable-btn" onclick=storeHSValue(${imp_hsn},"${importCountry}","${exportCountry}")> Proceed to Import Duty Calculator</button></div>`;
    // <button class="btn btn-outline-primary btn-icon-text hstable-btn" onclick=storeHSValue(${d.value},"${importCountry}","${exportCountry}")>
    hscodesDisplay.innerHTML += hscodeHTML;
}

function editHSField(event) {
    event.preventDefault();
    let hscodesDisplay = document.getElementById('show_hscodes'),
        hscodeForm = document.getElementById('hscode_form');
    hscodesDisplay.innerHTML = '';
    hscodeForm.style.visibility = 'visible';
    hscodeForm.style.display = 'flex';
}

async function loadHsCodes(event) {
    event.preventDefault();
    window.localStorage.removeItem("hscode");
    window.localStorage.removeItem("imp");
    window.localStorage.removeItem("exp");
    let hscodesDisplay = document.getElementById("show_hscodes"),
        importCountry = document.getElementById("import_country").value,
        exportCountry = document.getElementById("export_country").value,
        hscodeForm = document.getElementById('hscode_form'),
        hscode = document.getElementById("hscode").value;
    hscodeForm.style.visibility = 'hidden';
    hscodeForm.style.display = 'none';
    countryHSResponse = [];

    let formDetails = "";
    formDetails += `<div class='row hstable-form'><div class='col-sm-4'><span class='col-hs col-form-label'>Product Name/HS Code</span><input type='text' class='form-control form-control-lg' value='${hscode}'></div>`;
    formDetails += `<div class='col-sm-3'><span class='col-hs col-form-label'>Importing Country</span><input type='text' class='form-control form-control-lg' value='${importCountry}'> </div>`;
    formDetails += `<div class='col-sm-3'><span class='col-hs col-form-label'>Exporting Country</span><input type='text' class='form-control form-control-lg' value='${exportCountry}'> </div>`;
    formDetails += `<div class='col-sm-1'><button class='btn btn-outline-primary btn-icon-text' id='modifyHS' type='button' onclick='editHSField(event)'>Modify</button></div>`
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

function formPrefilledData() {
    let hscode = window.localStorage.getItem("hscode"),
        impCountry = window.localStorage.getItem("imp"),
        expCountry = window.localStorage.getItem("exp");
    let hscodeElement = document.getElementById("hscode"),
        impCountryElement = document.getElementById("import_country"),
        expCountryElement = document.getElementById("export_country");

    if (hscode && hscodeElement) {
        hscodeElement.value = hscode;
    }
    if (impCountry && impCountryElement) {
        impCountryElement.value = impCountry;
    }
    if (expCountry && expCountryElement) {
        expCountryElement.value = expCountry;
    }
} 