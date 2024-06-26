import React, { Component, createContext } from 'react';
import $ from 'jquery';
import axios from "axios"
import MetaMaskOnboarding from '@metamask/onboarding'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { connect } from "react-redux";
import { 
    check_format_thaiID, 
    encode_thaiID, 
    decode_thaiID,
    check_available_thaiID,
    check_available_username,
    check_available_walletaddress,
} from '../features/function'
import { 
    changeWalletAccount, 
    changeChainId, 
    checkMetaMaskInstalled, 
    setMMInstalledFlag, 
    setConnectFlag, 
    setLoginFlag, 
    setUsername, 
    setThaiID,
    updateTimeZone,
} from '../features/account/accountSlice';

const AuthenticationContext = createContext();
const AuthenSwal = withReactContent(Swal);
const connectWalletSwal = withReactContent(Swal);

class AuthProvider extends Component {
    constructor () {
        super()

        this.state = {
            onboarding: new MetaMaskOnboarding(),
            popupShown: false,
            is_mount: false,
        }

        this.signUp = this.signUp.bind(this)
        this.update_regis_status = this.update_regis_status.bind(this)
        this.connectMetaMask = this.connectMetaMask.bind(this)
        this.connectClickHandler = this.connectClickHandler.bind(this)
        this.connectWallet = this.connectWallet.bind(this)
    }

    async connectWallet (success_callback, dismiss_callback) {
        console.log("start connectWallet")
        connectWalletSwal.fire({
            title: <h1 className="h1 pb-2 fw-bold border-bottom text-black">Connect to your wallet</h1>,
            html: 
            <div className="container redeem-popup">
                <div className="row justify-content-center">
                    <div className="col-sm-8 py-2">
                        <button type="button" onClick={this.connectClickHandler} className="btn connect-wallet-btn d-inline-flex align-items-center">
                            <span className="col-7 h5 fw-bold m-0 ps-2 text-start">Metamask</span>
                            <img src={require('../img/metamask-icon.png')} className="col-5 m-1" style={{width: "6em", height: "6em"}} alt="Metamask" />
                        </button>
                    </div>
                </div>
            </div>,
            showConfirmButton: false,
        }).then(async (result) => {
            console.log(result)
            if (result.isConfirmed) {
                success_callback()
                
            } else if (result.isDismissed) {
                if (result.dismiss === "not registered") {
                    console.log("continue")
                    await this.signUp(success_callback, dismiss_callback)
                } else {
                    console.log("connect cancel kub")
                    dismiss_callback()
                }
            }
        })
    }

    async signUp (success_callback, dismiss_callback) {
        console.log("start signup")
        // Your login logic (e.g., API call, setting tokens, etc.)
        AuthenSwal.fire({
            title: <h1 className="h1 pb-2 fw-bold border-bottom text-black">Sign Up</h1>,
            html: 
            <div className="container redeem-popup">
                <div className="row">
                    <div className="col">
                        <form style={{textAlign: "left"}}>
                            <div className="mb-3 text-center">
                                <label htmlFor="exampleInputAddress1" className="form-label">
                                    Wallet Address: <span className="metamask-address color-black fw-bold">{this.props.account_detail.wallet_accounts[0]}</span>
                                </label> 
                            </div>
                            <div className="mb-3 text-center">
                                <label htmlFor="exampleInputUsername1" className="form-label" >Username</label>
                                <input type="text" className="form-control signup-form" id="signUpUsername" name="username" />
                            </div>
                            <div className="mb-3 text-center">
                                <label htmlFor="exampleInputThaiID1" className="form-label" >Citizen ID</label>
                                <input type="text" className="form-control signup-form" id="signUpThaiID" name="thai_id" />
                            </div>
                        </form>
                    </div>
                </div>
            </div>,
            focusConfirm: false,
            confirmButtonText: 'Register',
            confirmButtonColor: "#E3B04B",
            customClass: {
                validationMessage: 'my-validation-message'
            },
            didOpen: () => this.setState({ popupShown: true }),
            didClose: () => this.setState({ popupShown: false }),
            // showLoaderOnConfirm: true,
            preConfirm: async () => {
                let regis_rst = {
                    err: 1, 
                    thai_id: "", 
                    username: "", 
                    msg: "processing"
                }
                
                console.time('insert Account');
                var signup_username = $(".signup-form[name=username]").val().trim()
                var signup_thaiID = $(".signup-form[name=thai_id]").val().trim()
                // var signup_email = $(".signup-form[name=email]").val().trim()
                var signup_dict = {}
                var error_msg = [];
                var check_username_rst = await check_available_username(signup_username)
                console.log(error_msg.length)
                // check user
                if (signup_username === "") {
                console.log("null username.")
                error_msg.push("Username cannot be null");
                // AuthenSwal.showValidationMessage(
                //   '<i class="fa fa-info-circle"></i> Username cannot be null'
                // )
                $(".signup-form[name=username]").addClass("input-error");
                // flag += 1
                } else if (check_username_rst) {
                    console.log("registered username.")
                    // AuthenSwal.showValidationMessage(
                    //   '<i class="fa fa-info-circle"></i><span> Username: <b>' + signup_username + '</b> is already used!</span>'
                    // )
                    error_msg.push("Username: <b>" + signup_username + "</b> is already used!");
                    $(".signup-form[name=username]").addClass("input-error");
                    // flag += 1
                } else {
                    signup_dict["username"] = signup_username
                    $(".signup-form[name=username]").removeClass("input-error");
                } 

                // check thai_id
                // var encrypted_thai_id = encode_thaiID(signup_thaiID, this.props.account_detail.wallet_accounts[0])
                if (signup_thaiID === "") {
                $(".signup-form[name=thai_id]").addClass("input-error");
                console.log("null thai_id.")
                error_msg.push("Citizen ID cannot be null");
                } else if (!check_format_thaiID(signup_thaiID)) {
                $(".signup-form[name=thai_id]").addClass("input-error");
                console.log("wrong thai_id form.")
                error_msg.push("Citizen ID wrong format.");
                } else {
                var check_thaiID_rst = await check_available_thaiID(signup_thaiID)
                if (check_thaiID_rst) {
                    console.log("registered thai_id.")
                    error_msg.push("Citizen ID: " + signup_thaiID + " is already used!");
                    $(".signup-form[name=thai_id]").addClass("input-error");
                } else {
                    signup_dict["thai_id"] = signup_thaiID
                    $(".signup-form[name=thai_id]").removeClass("input-error");
                }
                }
                console.log(error_msg.length)
                
                //return
                console.log("flag: " , error_msg.length)
                if (error_msg.length === 0) {
                console.time('insert new account.');
                var cipher_thaiID = encode_thaiID(signup_dict["thai_id"], this.props.account_detail.wallet_accounts[0])
                console.log("encode_thai_id: ", cipher_thaiID)
                var insertItem = await axios.post(process.env.REACT_APP_API_BASE_URL+"/account", {
                    address: this.props.account_detail.wallet_accounts[0],
                    username: signup_dict["username"],
                    thai_id: cipher_thaiID
                });
                console.log(insertItem);
                if (insertItem.data.affectedRows !== undefined) {
                    console.timeEnd('insert Account')
                    regis_rst["err"] = 0
                    regis_rst["username"] = signup_username
                    regis_rst["thai_id"] = cipher_thaiID
                    regis_rst["msg"] = "insert success"
                    return regis_rst
                } else {
                    alert("db error")
                    regis_rst["err"] = 1
                    regis_rst["msg"] = "DB Error:" + insertItem.err
                    return regis_rst
                }
                } else {
                    for (var i = 0; i < error_msg.length; i++) { error_msg[i] = "• " + error_msg[i] }
                    AuthenSwal.showValidationMessage(
                        "<span>" + error_msg.join("<br>") + "</span>"
                    )
                } 
            },
            allowOutsideClick: () => !AuthenSwal.isLoading()
        }).then(async (result) => {
            console.log(result)
            if (result.isConfirmed) {
                if (result.value.err === 0) {
                AuthenSwal.fire('Register success', '', 'success')
                    await this.props.dispatch(setLoginFlag(true))
                    await this.props.dispatch(setUsername(result.value.username))
                    await this.props.dispatch(setThaiID(result.value.thai_id))
                    success_callback();
                } else {
                    AuthenSwal.fire('Error', result.value.msg, 'error')
                }
            } else if (result.isDismissed) {
                dismiss_callback();
            }
        })
    };

    async update_regis_status (account) {
        console.log("start update_regis_status")
        let {is_existed, username, thai_id} = await check_available_walletaddress(account)
        console.log({is_existed, username, thai_id})
        if (is_existed) {
            await this.props.dispatch(setUsername(username))
            await this.props.dispatch(setThaiID(thai_id))
            // connectWalletSwal.close({isConfirmed: true})
        } else {
            // connectWalletSwal.close({isDismissed: true, dismiss: "not registered"})
        }
        await this.props.dispatch(setLoginFlag(is_existed))
        return is_existed
    }

    async connectClickHandler () {
        await this.connectMetaMask()
        if (this.props.account_detail.isConnected && !this.props.account_detail.isLogin) {
            connectWalletSwal.close({isDismissed: true, dismiss: "not registered"})
        } else if (this.props.account_detail.isLogin) {
            connectWalletSwal.close({isConfirmed: true})
        } else {
            connectWalletSwal.close()
        }
    }

    async connectMetaMask () {
        console.log("start connectMetaMask")
        // Request to connect to the MetaMask wallet
        await window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(async(accounts) => {
            await this.props.dispatch(changeWalletAccount(accounts))
            if (accounts.length > 0) {
                localStorage.setItem('current_account', accounts[0]);
                let is_existed = await this.update_regis_status(accounts[0])
            }
        })
    }

    switchToAvalancheChain () {
        // Request to switch to the selected Avalanche network
        window.ethereum
        .request({
            method: 'wallet_addEthereumChain',
            params: [this.props.account_detail.AvalancheChain]
        })
    }

    componentDidMount() {
        this.setState({
            is_mount: true
        })
        
    }

    componentDidUpdate(prevProps, prevState) {
        if ( prevState.is_mount !== this.state.is_mount ) {
            console.log("context DidMount")
            // componentDidMount
            if (MetaMaskOnboarding.isMetaMaskInstalled()) {
                this.props.dispatch(setMMInstalledFlag(true))

                const session_account = localStorage.getItem('current_account');
                console.log(session_account)
                if (session_account === null) {
                    // this.connectMetaMask()
                } else {
                    let is_existed = this.update_regis_status([session_account])
                    this.props.dispatch(changeWalletAccount([session_account]))
                }

                // chain
                window.ethereum.request({method: 'net_version'}).then(chainId => {
                this.props.dispatch(changeChainId(chainId))
                console.log("net_version")
                })

                // Reload the site if the user selects a different chain
                window.ethereum.on('chainChanged', (chainId) => {
                this.props.dispatch(changeChainId(chainId))
                console.log("chainChanged")
                // window.location.reload()
                })  

                // Set the chain id once the MetaMask wallet is connected
                window.ethereum.on('connect', (connectInfo) => {
                const chainId = connectInfo.chainId
                this.props.dispatch(changeChainId(chainId))
                console.log("connect")
                })

                // Update the list of accounts if the user switches accounts in MetaMask
                window.ethereum.on('accountsChanged', async (accounts) => {
                    console.log("account did mount")
                    if (accounts.length > 0 && this.props.account_detail.wallet_accounts[0] !== accounts[0]) {
                        localStorage.setItem('current_account', accounts[0]);
                        let is_existed = await this.update_regis_status(accounts[0])
                        // if (is_existed) {
                        //     connectWalletSwal.close({isConfirmed: true})
                        // } else {
                        //     connectWalletSwal.close({isDismissed: true, dismiss: "not registered"})
                        // }
                    }
                    await this.props.dispatch(changeWalletAccount(accounts))
                })

            } else {
                this.props.dispatch(setMMInstalledFlag(false))
            }
        }

        if (this.props.account_detail.MetaMaskIsInstalled) {
            if (this.props.account_detail.wallet_accounts.length > 0) {
                // If the user is connected to MetaMask, stop the onboarding process.
                this.state.onboarding.stopOnboarding()
            }
        }
    }

    render() {
        const { children } = this.props;

        return (
        <AuthenticationContext.Provider
            value={{ 
                connectWallet: this.connectWallet, 
            }}
        >
            {children}
        </AuthenticationContext.Provider>
        );
    }
}

const mapStateToProps = (state) => ({
    account_detail: state.account
});

AuthProvider = connect(mapStateToProps)(AuthProvider)
  
export { AuthenticationContext, AuthProvider };