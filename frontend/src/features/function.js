import CryptoJS from 'crypto-js'
import { BigNumber, ethers } from 'ethers'
// import format from 'date-fns/format';
import { formatInTimeZone } from 'date-fns-tz';
import contractTicketPlace from '../contracts/ticketMarketPlace.json'


export function sortArrayByDateKey(array, key, reverse) {
  return array.sort((a, b) => {
      let dateA = new Date(a[key]);
      let dateB = new Date(b[key]);

      if (reverse) {
      	if (dateA < dateB) {
          return 1;
        } else if (dateA > dateB) {
            return -1;
        } else {
            return 0;
        }
      } else {
      	if (dateA < dateB) {
          return -1;
        } else if (dateA > dateB) {
            return 1;
        } else {
            return 0;
        }
      }
  });
}

export function sortArrayByMultipleKeys(array, keys, datetime_keys, reverse) {
    return array.sort((a, b) => {
    		let index_count = 0
        for (let key of keys) {
        	let a_value = a[key];
      		let b_value = b[key];

      		if (key in datetime_keys) {
      			a_value = new Date(a_value)
      			b_value = new Date(b_value)
      		}

        	if (reverse[index_count]) {
            if (a_value < b_value) {
                return 1;
            } else if (a_value > b_value) {
                return -1;
            }
          } else {
          	if (a_value < b_value) {
                return -1;
            } else if (a_value > b_value) {
                return 1;
            }
          }
          index_count += 1
        }
        return 0;
    });
}

export function check_format_thaiID(thai_id) {
	if (/[0-9]{13}/.test(thai_id)) {
	  var input_sum = 0
	  for (var i = 0; i < 12; i++) { input_sum += (parseInt(thai_id[i]) * (13-i)) }
	  var remainde_str = (11 - (input_sum % 11)).toString()
	  var last_char_check = remainde_str[remainde_str.length-1]
	  if (thai_id[12] === last_char_check) {
	    return true
	  } else {
	    return false
	  }
	}  else {
	  return false
	}
}

export function encode_thaiID(thai_id, address) {
	const passphrase = address
	const inpututf = CryptoJS.enc.Utf8.parse(thai_id);
	const keyutf = CryptoJS.enc.Utf8.parse(passphrase);
	const iv = CryptoJS.enc.Base64.parse(address);
	return CryptoJS.AES.encrypt(thai_id, passphrase).toString()
	// return CryptoJS.AES.encrypt(JSON.stringify({ thai_id }), passphrase).toString()
	// return CryptoJS.AES.encrypt(JSON.stringify(thai_id), passphrase).toString()
}

export function decode_thaiID(ciphertext, address) {
	console.log(ciphertext, address)
	const passphrase = address;
	const inpututf = CryptoJS.enc.Base64.parse(ciphertext);
	const iv = CryptoJS.enc.Base64.parse(passphrase);
	const keyutf = CryptoJS.enc.Utf8.parse(passphrase);
	const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
	const originalText = bytes.toString(CryptoJS.enc.Utf8);
	console.log(originalText)
	return originalText;
}

export function is_ticket_available(ticket_detail, include_2ndHandTicket = false) {
	let is_available = false;
	if (ticket_detail['booking'] === null && ticket_detail['is_hold'] === null) {
		if (ticket_detail['owner'] === null) {
			is_available = true;
		} else {
			if (include_2ndHandTicket) {
				if (ticket_detail['in_marketplace'] === null) {
					is_available = false;
				} else {
					is_available = true;
				}
			} else {
				is_available = false;
			}
		}
	}
	return is_available;
}

export function is_beside_ticket(selected_seat_detail, current_seat_row, current_min_seat_id, current_max_seat_id) {
	let is_beside = false;
	if ((selected_seat_detail["seat_row"] == current_seat_row) && 
        (selected_seat_detail["seat_id"] == (current_min_seat_id - 1) || selected_seat_detail["seat_id"] == (current_max_seat_id + 1))
       ) {
		is_beside = true;
	}
	return is_beside;
}

export function get_ticket_status(ticket_detail, event_detail) {
    let ticket_status = "active"
    let now = new Date()
    let date_event = new Date(event_detail.date_event)

    if (ticket_detail.is_use !== null) {
      ticket_status = "used"
    } else if (ticket_detail.in_marketplace !== null) {
      ticket_status = "on-sale"
    } else if (now > date_event) {
      ticket_status = "past"
    } else {
      ticket_status = "active"
    }
    return ticket_status
}

export function gen_purchase_form(seat_detail, event_detail, buyer_account, timezone) {

	let ticket_id = seat_detail["ticket_id"]
	let event_id = event_detail["event_id"]
	let event_name = event_detail["event_name"]
	let zone = seat_detail["zone"]
	let seat = seat_detail["seat_row"] + seat_detail["seat_id"]
	let price = seat_detail["price"]
	let limit = event_detail["purchase_limit"]
	let metadata = seat_detail["metadata"]
	let owner = buyer_account
	let isHold = (seat_detail["is_hold"]) ? (true) : (false)

	let date_event = formatInTimeZone(new Date(event_detail["date_event"]), timezone, 'yyyyMMddHHmm')
	let date_sell = formatInTimeZone(new Date(event_detail["date_sell"]), timezone, 'yyyyMMddHHmm')
	let date_buy = formatInTimeZone(new Date(), timezone, 'yyyyMMddHHmm')
	let date = [date_event, date_sell, date_buy]

	let purchase_form = {
		ticket_id: ticket_id,
		event_id: event_id,
		event_name: event_name,
		date: date,
		zone: zone,
		seat: seat,
		price: price,
		limit: limit,
		metadata: metadata,
		owner: owner,
		isHold: isHold,
		// price: price,
	}
	
	return purchase_form
}

///////////// SMART CONTRACT FUNC //////////////////

export async function createTicket(purchase_form) {
	let purchase_result = {
		error: 0,
		resp: '',
		msg: ''
	}

	console.log(
		{
		ticket_id: purchase_form['ticket_id'],
		event_id: purchase_form['event_id'],
		event_name: purchase_form['event_name'],
		date: purchase_form['date'],
		zone: purchase_form['zone'],
		seat: purchase_form['seat'],
		price: purchase_form['price'],
		limit: purchase_form['limit'],
		metadata: purchase_form['metadata'],
		owner: purchase_form['owner'],
		isHold: purchase_form['isHold'],
		}
	)

	const provider = new ethers.providers.Web3Provider(window.ethereum)
	await provider.send("eth_requestAccounts", []);

	const contractMaket = await new ethers.Contract(
		process.env.REACT_APP_TICKET_ADDRESS,
		contractTicketPlace.output.abi,
		provider.getSigner(),
	)

	try {
		const createTicket_resp = await contractMaket.createTicket(
		purchase_form['ticket_id'], 
		purchase_form['event_id'], 
		purchase_form['event_name'], 
		purchase_form['date'], 
		purchase_form['zone'], 
		purchase_form['seat'], 
		purchase_form['price'], 
		purchase_form['limit'], 
		purchase_form['metadata'], 
		purchase_form['owner'], 
		purchase_form['isHold'],
		{ value: purchase_form['price'] }
		)
		console.log(createTicket_resp)
		// Swal.fire('buy success!')

		purchase_result['resp'] = createTicket_resp

	} catch (e) {
		let show_error_text = e.reason;
		if (show_error_text.includes("User denied transaction signature")) {
		// show_error_text = "Purchase is cancelled. Please try again."
		show_error_text = "You cancelled the transaction. Please try again."
		} else if (show_error_text.includes("This Ticket is not for sell yet")) {
		show_error_text = "This Ticket is not for sell yet"
		} else if (show_error_text.includes("You need to pay the correct price.")) {
		show_error_text = "You need to pay the correct price."
		}
		console.log(e)
		purchase_result['error'] = 1
		purchase_result['msg'] = show_error_text
	}

	return purchase_result

	

	// return new Promise(resolve => {
	//   setTimeout(() => resolve({'ticket_id = ' + ticket_id}), 1*1000);
	// });
	// await new Promise(resolve => {
	// 	setTimeout(() => resolve(), 1*1000);
	// });
	// return { error: 0, resp: null, msg: ''}
	// return { error: 1, resp: null, msg: 'Purchase is cancelled. Please try again.'}
}

export async function addProduct(ticket_id, price, gas){

	let sell_result = {
		error: 0,
		resp: '',
		msg: ''
	}

	const provider = new ethers.providers.Web3Provider(window.ethereum)

	const contractMaket = await new ethers.Contract(
		process.env.REACT_APP_TICKET_ADDRESS,
		contractTicketPlace.output.abi,
		provider.getSigner(),
	)

	try {
		const sell_resp = await contractMaket.addProduct(
			ticket_id, 
			price, 
			gas, 
		)
		console.log(sell_resp)
		sell_result['resp'] = sell_resp
	} catch (e) {
		let show_error_text = e.reason;
		if (show_error_text.includes("User denied transaction signature")) {
			show_error_text = "You cancelled the transaction. Please try again."
		} else if (show_error_text.includes("This metadata has already been used to mint an NFT.")) {
			show_error_text = "Ticket is already bought."
		} else if (show_error_text.includes("This Ticket is not for sell yet")) {
			show_error_text = "This Ticket is not for sell yet."
		} else if (show_error_text.includes("The ticket can only be listed once")) {
			show_error_text = "This Ticket already on sale."
		}
		console.log(e)
		sell_result['error'] = 1
		sell_result['msg'] = show_error_text
	}

	return sell_result
}

export async function buyProduct(ticket_id, price){

    let buy_result = {
      error: 0,
      resp: '',
      msg: ''
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // await provider.send("eth_requestAccounts", []);

    const contractMaket = await new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi,
      provider.getSigner(),
    )

    try {
      const buy_resp = await contractMaket.buyProduct(
        ticket_id,
        { value: price } 
      )
      console.log(buy_resp)
      buy_result['resp'] = buy_resp

    } catch (e) {
      let show_error_text = e.reason;
      if (show_error_text.includes("User denied transaction signature")) {
        show_error_text = "You cancelled the transaction. Please try again."
      } else if (show_error_text.includes("This metadata has already been used to mint an NFT.")) {
        show_error_text = "Ticket is already bought."
      } else if (show_error_text.includes("This Ticket is not for sell yet")) {
        show_error_text = "This Ticket is not for sell yet"
      } else if (show_error_text.includes("You need to pay the correct price.")) {
        show_error_text = "You need to pay the correct price."
      }
      console.log(e)
      buy_result['error'] = 1
      buy_result['msg'] = show_error_text
    }

    return buy_result

	// await new Promise(resolve => {
	// 	setTimeout(() => resolve(), 1*1000);
	// });
	// return { error: 0, resp: null, msg: ''}
	// return { error: 1, resp: null, msg: 'Purchase is cancelled. Please try again.'}
  }

export async function cancelProduct(ticket_id){

	let cancel_result = {
		error: 0,
		resp: '',
		msg: ''
	}

	const provider = new ethers.providers.Web3Provider(window.ethereum)

	const contractMaket = await new ethers.Contract(
		process.env.REACT_APP_TICKET_ADDRESS,
		contractTicketPlace.output.abi,
		provider.getSigner(),
	)

	try {
		const cancel_resp = await contractMaket.cancelProduct(
			ticket_id
		)
		console.log(cancel_resp)
		cancel_result['resp'] = cancel_resp
  
	} catch (e) {
		let show_error_text = e.reason;
		if (show_error_text.includes("User denied transaction signature")) {
		  show_error_text = "You cancelled the transaction. Please try again."
		} else if (show_error_text.includes("This metadata has already been used to mint an NFT.")) {
		  show_error_text = "Ticket is already bought."
		} else if (show_error_text.includes("This Ticket is not for sell yet")) {
		  show_error_text = "This Ticket is not for sell yet"
		} else if (show_error_text.includes("You need to pay the correct price.")) {
		  show_error_text = "You need to pay the correct price."
		}
		console.log(e)
		cancel_result['error'] = 1
		cancel_result['msg'] = show_error_text
	}
  
	return cancel_result
}

  export async function get_createTicket_gasFee(purchase_form) {
	let estimation_gas = 0;

	// gas
	const provider = new ethers.providers.Web3Provider(window.ethereum)
    var gasPrice = await provider.getGasPrice()

    // estimate gas
    const erc20 = new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi, 
      provider
    );

	estimation_gas = await erc20.estimateGas.createTicket(
	purchase_form['ticket_id'],
	purchase_form['event_id'],
	purchase_form['event_name'],
	purchase_form['date'],
	purchase_form['zone'],
	purchase_form['seat'],
	purchase_form['price'],
	purchase_form['limit'],
	purchase_form['metadata'],
	purchase_form['owner'],
	purchase_form['isHold'],
	{ from: purchase_form['owner'], value: purchase_form['price'] } 
	)

    gasPrice = BigNumber.from(gasPrice)
    estimation_gas = BigNumber.from(estimation_gas)
    let total_gas = gasPrice.mul(estimation_gas)
	return total_gas;
}

export async function get_addProduct_gasFee(ticket_id, price, gas, owner) {
	let estimation_gas = 0;

	// gas
	const provider = new ethers.providers.Web3Provider(window.ethereum)
    var gasPrice = await provider.getGasPrice()

    // estimate gas
    const erc20 = new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi, 
      provider
    );

	estimation_gas = await erc20.estimateGas.addProduct(
		ticket_id,
		price,
		gas,
		{ from: owner } 
	)

    gasPrice = BigNumber.from(gasPrice)
    estimation_gas = BigNumber.from(estimation_gas)
    let total_gas = gasPrice.mul(estimation_gas)
	return total_gas;
}

export async function get_buyProduct_gasFee(ticket_id, price, buyer) {
	let estimation_gas = 0;

	// gas
	const provider = new ethers.providers.Web3Provider(window.ethereum)
    var gasPrice = await provider.getGasPrice()

    // estimate gas
    const erc20 = new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi, 
      provider
    );

	estimation_gas = await erc20.estimateGas.buyProduct(
	ticket_id,
	{ from: buyer, value: price } 
	)

    gasPrice = BigNumber.from(gasPrice)
    estimation_gas = BigNumber.from(estimation_gas)
    let total_gas = gasPrice.mul(estimation_gas)
	return total_gas;
}

export async function get_cancelProduct_gasFee(ticket_id, owner) {
	let estimation_gas = 0;

	// gas
	const provider = new ethers.providers.Web3Provider(window.ethereum)
    var gasPrice = await provider.getGasPrice()

    // estimate gas
    const erc20 = new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi, 
      provider
    );

	estimation_gas = await erc20.estimateGas.cancelProduct(
		ticket_id,
		{ from: owner } 
	)

    gasPrice = BigNumber.from(gasPrice)
    estimation_gas = BigNumber.from(estimation_gas)
    let total_gas = gasPrice.mul(estimation_gas)
	return total_gas;
}

export async function get_2ndHand_price(ticket_id) {
	let rst = {price: BigNumber.from(0), gas: BigNumber.from(0)}

	// gas
	const provider = new ethers.providers.Web3Provider(window.ethereum)
    // await provider.send("eth_requestAccounts", []);

    const contractMaket = await new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi,
      provider.getSigner(),
    )

    const detail_resp = await contractMaket.getProdust(
      ticket_id
    )
    // console.log(detail_resp)
    rst['price'] = detail_resp[0]
    rst['gas'] = detail_resp[1]

	return rst;
}

export async function get_gasFee_from_trx(trx) {
	const provider = new ethers.providers.Web3Provider(window.ethereum) 
    const txReceipt = await provider.getTransaction(trx)
    // const txReceipt = await provider.getTransactionReceipt(trx)
    // console.log(txReceipt) 

    let gasPrice = txReceipt.gasPrice
    let gasLimit = txReceipt.gasLimit
    let gasFee = gasPrice.mul(gasLimit)
    // console.log(ethers.utils.formatEther(gasPrice)) 
    // console.log(gasLimit.toString()) 
    // console.log(ethers.utils.formatEther(gasFee)) 

	return gasFee;
}