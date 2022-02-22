import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { ethers } from "ethers";
import contractAbi from "./utils/contractABI.json";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";
import { networks } from "./utils/networks";

// Constants
const BUILDSPACE_TWITTER_HANDLE = "_buildspace";
const PROFILE_TWITTER_HANDLE = "seba_itokazu";
const BUILDSPACE_TWITTER_LINK = `https://twitter.com/${BUILDSPACE_TWITTER_HANDLE}`;
const PROFILE_TWITTER_LINK = `https://twitter.com/${PROFILE_TWITTER_HANDLE}`;
const BASE_TWITTER_PROFILE = 'https://twitter.com/';
const tld = ".ibis";
const CONTRACT_ADDRESS = "0xf96e28F8b5C65566257753911eF41C45C56aB06F";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [domain, setDomain] = useState("");
  const [nickname, setNickname] = useState("");
  const [spotifyLink, setSpotifyLink] = useState("");
  const [twitter, setTwitter] = useState("");
  const [network, setNetwork] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mints, setMints] = useState([]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      // Fancy method to request access to account.
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: "eth_accounts" });

    // Users can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }

    const chainId = await ethereum.request({ method: "eth_chainId" });
    setNetwork(networks[chainId]);

    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("accountsChanged", handleAccountChanged);

    // Reload the page when they change networks
    function handleChainChanged(_chainId) {
      window.location.reload();
    }

    function handleAccountChanged(){
      window.location.reload();
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13881" }], // Check networks.js for hexadecimal network ids
        });
      } catch (error) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x13881",
                  chainName: "Polygon Mumbai Testnet",
                  rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // You know all this
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        // Get all the domain names from our contract
        const names = await contract.getAllNames();

        // For each name, get the record and the address
        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.getRecord(name);
            const owner = await contract.getAddress(name);
            return {
              id: names.indexOf(name) + 1,
              name: name,
              nickname: mintRecord.nickname,
              spotifyLink: mintRecord.spotifyLink,
              twitter: mintRecord.twitter,
              owner: owner,
            };
          })
        );

        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const mintDomain = async () => {
    // Don't run if the domain is empty
    if (!domain) {
      return;
    }
    // Calculate price based on length of domain
    // 3 or less chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
    const price =
      domain.length <= 3 ? "0.5" : domain.length === 4 ? "0.3" : "0.1";
    console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });
        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Check if the transaction was successfully completed
        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          // Set the record for the domain
          tx = await contract.setAllRecords(
            domain,
            nickname,
            spotifyLink,
            twitter
          );
          await tx.wait();

          console.log(
            "All records set! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          setTimeout(() => {
            fetchMints();
          }, 2000);

          clearInput();
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateDomain = async () => {
    if (!nickname || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", nickname, );
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        let tx = await contract.setAllRecords(domain, nickname, spotifyLink, twitter);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

        fetchMints();
        clearInput();
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
    setEditing(false);
  };

  const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
      {/* <img
        src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif"
        alt="Ninja gif"
      /> */}
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect Wallet
      </button>
    </div>
  );

  // Form to enter domain name and data
  const renderInputForm = () => {
    if (network !== "Polygon Mumbai Testnet") {
      return (
        <div className="connect-wallet-container">
          <p>Please connect to the Polygon Mumbai Testnet</p>
          <button
            className="cta-button change-network-button"
            onClick={switchNetwork}
          >
            Click here to switch
          </button>
        </div>
      );
    }

    return (
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            value={domain}
            placeholder="domain"
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className="tld"> {tld} </p>
        </div>

        <input
          type="text"
          value={nickname}
          placeholder="Your nickname"
          onChange={(e) => setNickname(e.target.value)}
        />

        <input
          type="text"
          value={spotifyLink}
          placeholder="Your Spotify fav song"
          onChange={(e) => setSpotifyLink(e.target.value)}
        />

        <input
          type="text"
          value={twitter}
          placeholder="Your twitter account"
          onChange={(e) => setTwitter(e.target.value)}
        />
        {editing ? (
          <div className="button-container">
            <button
              className="cta-button mint-button"
              disabled={loading}
              onClick={updateDomain}
            >
              Set record
            </button>
            <button
              className="cta-button mint-button"
              onClick={() => {
                setEditing(false);
                clearInput();
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          // If editing is not true, the mint button will be returned instead
          <button
            className="cta-button mint-button"
            disabled={loading}
            onClick={mintDomain}
          >
            Mint
          </button>
        )}
      </div>
    );
  };

  // Add this render function next to your other render functions
  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="mint-container">
          <p className="subtitle"> Recently minted domains!</p>
          <div className="mint-list">
            {mints.map((mint, index) => {
              return (
                <div className="mint-item" key={index}>
                  <div className="mint-row">
                    <a
                      className="link"
                      href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <p className="underlined">
                        {" "}
                        {mint.name}
                        {tld}{" "}
                      </p>
                    </a>
                    {/* If mint.owner is currentAccount, add an "edit" button*/}
                    {mint.owner.toLowerCase() ===
                    currentAccount.toLowerCase() ? (
                      <button
                        className="edit-button"
                        onClick={() => editRecord(mint.name, mint.nickname, mint.spotifyLink, mint.twitter)}
                      >
                        <img
                          className="edit-icon"
                          src="https://img.icons8.com/metro/26/000000/pencil.png"
                          alt="Edit button"
                        />
                      </button>
                    ) : null}
                  </div>
                  <p> {mint.nickname} </p>
                  <div className="spotify-box">
                    {mint.spotifyLink && 
                      <iframe title={mint.name + mint.id} src={formatSpotifyLink(mint.spotifyLink)} width="300" height="80" frameBorder="0" allow="encrypted-media"></iframe>
                    }
                  </div>
                  <div>
                    {mint.twitter && 
                      <div>
                          <a
                            className="footer-text"
                            href={BASE_TWITTER_PROFILE + mint.twitter}
                            target="_blank"
                            rel="noreferrer"
                          >{`@${mint.twitter}`}</a>
                        </div>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const editRecord = (name, nickname, spotifyLink, twitter) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
    setNickname(nickname);
    setSpotifyLink(spotifyLink);
    setTwitter(twitter);
  }

  const clearInput = () => {
    setNickname("");
    setSpotifyLink("");
    setTwitter("");
    setDomain("");
  }

  const formatSpotifyLink = (spotifyLink) => {
    return spotifyLink.replace("https://open.spotify.com", "https://open.spotify.com/embed");
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if (network === "Polygon Mumbai Testnet") {
      fetchMints();
    }
  }, [currentAccount, network]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <p className="title">🚀 Ibis Name Service</p>
              <p className="subtitle">Your immortal API on the blockchain!</p>
            </div>
            <div className="right">
              <img
                alt="Network logo"
                className="logo"
                src={network.includes("Polygon") ? polygonLogo : ethLogo}
              />
              {currentAccount ? (
                <p>
                  {" "}
                  Wallet: {currentAccount.slice(0, 6)}...
                  {currentAccount.slice(-4)}{" "}
                </p>
              ) : (
                <p> Not connected </p>
              )}
            </div>
          </header>
        </div>

        {!currentAccount && renderNotConnectedContainer()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          built with &nbsp;
          <a
            className="footer-text"
            href={BUILDSPACE_TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`@${BUILDSPACE_TWITTER_HANDLE}`}</a>
          &nbsp; by &nbsp;
          <a
            className="footer-text"
            href={PROFILE_TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`@${PROFILE_TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
