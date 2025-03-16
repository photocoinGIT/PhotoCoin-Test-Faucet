async function getIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (e) {
      return null;
    }
  }

async function addTokenToWallet() {
    
    if (localStorage.getItem('tokenAdded')) {
      return;
    }

    const tokenAddress = "0x4EFfaC3BF8741659A752a6b606e13709A24a590d";
    const tokenSymbol = "PCT";
    const tokenDecimals = 18;
    const tokenImage = "https://photocoinGIT.github.io/PhotoCoin-Test-Faucet/logo.png";
  
    try {
      const wasAdded = await ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });
        
      if (wasAdded) {
        localStorage.setItem('tokenAdded', 'true');
      } else {
        console.log("Error");
      }
  
    } catch (error) {
      console.error("Error:", error);
    }
  }
  
  document.getElementById("claimButton").addEventListener("click", async () => {
    const messageEl = document.getElementById("message");
    messageEl.textContent = "Verification...";
  
    const walletAddress = document.getElementById("walletAddress").value.trim();
    if (!walletAddress) {
      messageEl.textContent = "Please enter your wallet address.";
      return;
    }

    const ip = await getIP();
    if (!ip) {
      return;
    }
    const ipKey = "claim_" + ip;
    const lastClaimIP = localStorage.getItem(ipKey);
    const now = Date.now();
    if (lastClaimIP && now - parseInt(lastClaimIP) < 24 * 60 * 60 * 1000) {
      messageEl.textContent = "Tokens have already been received for this address in the last 24 hours.";
      return;
    }
  
    if (typeof window.ethereum === "undefined") {
      messageEl.textContent = "MetaMask not found.";
      return;
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const signerAddress = await signer.getAddress();
    if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      messageEl.textContent = "The entered address does not match the connected wallet.";
      return;
    }
    
    const faucetAddress = document.querySelector('meta[name="contract-address"]').content;
    const faucetAbi = [
    	{
    		"inputs": [],
    		"name": "claim",
    		"outputs": [],
    		"stateMutability": "nonpayable",
    		"type": "function"
    	},
    	{
    		"inputs": [
    			{
    				"internalType": "uint256",
    				"name": "newAmount",
    				"type": "uint256"
    			}
    		],
    		"name": "setClaimAmount",
    		"outputs": [],
    		"stateMutability": "nonpayable",
    		"type": "function"
    	},
    	{
    		"inputs": [
    			{
    				"internalType": "address",
    				"name": "tokenAddress",
    				"type": "address"
    			}
    		],
    		"stateMutability": "nonpayable",
    		"type": "constructor"
    	},
    	{
    		"inputs": [],
    		"name": "claimAmount",
    		"outputs": [
    			{
    				"internalType": "uint256",
    				"name": "",
    				"type": "uint256"
    			}
    		],
    		"stateMutability": "view",
    		"type": "function"
    	},
    	{
    		"inputs": [
    			{
    				"internalType": "address",
    				"name": "",
    				"type": "address"
    			}
    		],
    		"name": "lastClaim",
    		"outputs": [
    			{
    				"internalType": "uint256",
    				"name": "",
    				"type": "uint256"
    			}
    		],
    		"stateMutability": "view",
    		"type": "function"
    	},
    	{
    		"inputs": [],
    		"name": "owner",
    		"outputs": [
    			{
    				"internalType": "address",
    				"name": "",
    				"type": "address"
    			}
    		],
    		"stateMutability": "view",
    		"type": "function"
    	},
    	{
    		"inputs": [],
    		"name": "token",
    		"outputs": [
    			{
    				"internalType": "contract IERC20",
    				"name": "",
    				"type": "address"
    			}
    		],
    		"stateMutability": "view",
    		"type": "function"
    	}
    ];
    
    const faucetContract = new ethers.Contract(faucetAddress, faucetAbi, signer);
    
    try {
      const tx = await faucetContract.claim();
      messageEl.textContent = "Transaction sent. Waiting for confirmation...";
      await tx.wait();
      localStorage.setItem(ipKey, now.toString());
      messageEl.textContent = "Confirm adding the token...";
      addTokenToWallet();
      messageEl.textContent = "Tokens sent successfully.";
    } catch (error) {
      console.error(error);
      messageEl.textContent = "Error: " + (error.data && error.data.message ? error.data.message : error.message);
    }
  });
  
