import { ReactNode, useEffect, useState } from 'react';

//3rd party libraries
import { Input, message, Select } from 'antd';
import moment, { Moment } from 'moment';

import './forex-converter.css';
import { HOST_IP } from '../common';

//Hard code currency full names since there are currently only 4 supported currencies.
//These could be obtained from an api if the list grows and is dynamic
const FOREX_CURRENCY_FULL_NAME: Record<string, string> = {
    "USD": "US Dollar",
    "NZD": "New Zealand Dollar",
    "JPY": "Japanese Yen",
    "CNY": "Chinese Yuan Renminbi"
}

const { Option } = Select;

interface IForexConverterProps {
    showLastUpdated?: boolean
}

interface IRateInfo {
    rate: number,
    lastUpdate: Moment
}

const ForexConverter: React.FC<IForexConverterProps> = (props) => {

    const [amount, setAmount] = useState<string>("1.00");
	const [forexRates, setForexRates] = useState<Map<string, IRateInfo>>(new Map());
    const [currentCurrency, setCurrentCurrency] = useState<string>();

    useEffect(() => {
        getForexRates();
    }, []);

    //Gets the latest forex rates from the server
    function getForexRates() {
        fetch(`http://${HOST_IP}:8080/rates`, { method: 'GET' })
        .then(res => res.json())
        .then((response) => {
            processForexRateResponse(response);
        }, (response) => {
            alert(response);
            message.error("An unexpected error ocurred", 10);
        });
    }

    //Processes the response and stores the forex data in react state
    function processForexRateResponse(response: any) {
        let rates = new Map();
        let initialCurrency: string = "";
        for(let rateInfo of response.rates) {
            let targetCurrency: string = rateInfo._id.substring(3,6);

            if(!initialCurrency) initialCurrency = targetCurrency; 

            let rate: IRateInfo = {
                rate: rateInfo.rate as number,
                lastUpdate: moment(rateInfo.lastUpdated)
            }

            rates.set(targetCurrency, rate);
        }
        setForexRates(rates);
        setCurrentCurrency(initialCurrency);
    }

    function handleCurrencyChange(value: string) {
        setCurrentCurrency(value);
    }

    function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
        setAmount(e.target.value);
    }

    function setAmountPrecision() {
        setAmount(Number(amount).toFixed(2))
    }

    //Calculates and returns a string for the converted currency
    function convertedCurrency() {
        if(currentCurrency && forexRates.get(currentCurrency)?.rate){
            let rate = forexRates.get(currentCurrency)?.rate;
            if(rate) {
                return `${(Number(amount) * rate).toPrecision(6)} ${FOREX_CURRENCY_FULL_NAME[currentCurrency] ? FOREX_CURRENCY_FULL_NAME[currentCurrency] : currentCurrency}`
            }
        }
    }

    function renderTargetCurrencyOptions() {
        let options:ReactNode[] = [];
        forexRates.forEach((value, key) => {
            options.push(
                <Option key={key} value={key}>{key}{FOREX_CURRENCY_FULL_NAME[key] ? ` - ${FOREX_CURRENCY_FULL_NAME[key]}` : ''}</Option>
            );
        });
        return options;
    }

    return (
        <div className="forex-converter">
            <div className="forex-amount">
                <span className="field-heading">Amount</span>
                <Input
                    className="forex-input-amount"
                    value={amount}
                    type="number"
                    onBlur={setAmountPrecision}
                    onChange={handleAmountChange}
                    prefix={"$"} 
                />
            </div>
            <div className="source-currency">
                <span className="field-heading">From</span>
                <div className="source-currency-value">
                    AUD - Australian Dollar
                </div>
            </div>
            <div className="target-currency">
                <span className="field-heading">To</span>
                <Select loading={!currentCurrency ? true : false} value={currentCurrency} dropdownStyle={{ width: "100%" }} onChange={handleCurrencyChange}>
                    {renderTargetCurrencyOptions()}
                </Select>
            </div>
            <div className="converted-amount" hidden={!currentCurrency ? true : false}>
                <span>
                    {Number(amount).toFixed(2)} Australian {Number(amount) === 1 ? "Dollar" : "Dollars"} =
                </span>
                <span className="converted-value">
                    {convertedCurrency()}
                </span>
                <span className="secondary-info">
                    <span className="exchange-rate">
                        {(Number(amount) !== 1 && currentCurrency) ? `1 AUD = ${forexRates.get(currentCurrency)?.rate.toPrecision(6)}` : ''}
                    </span>
                    <span className="last-updated">
                        {(props.showLastUpdated && currentCurrency) && `Rates last updated: ${forexRates.get(currentCurrency)?.lastUpdate.utc().format("DD MMM YYYY, HH:mm UTC")}`}
                    </span>
                </span>
            </div>
        </div>
    )
}

ForexConverter.defaultProps = {
    showLastUpdated: true
}

export default ForexConverter;