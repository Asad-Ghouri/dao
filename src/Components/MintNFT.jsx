import {
  useAddress,
  useNetwork,
  useContract,
  ConnectWallet,
  Web3Button,
  useNFTBalance,
} from '@thirdweb-dev/react';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom"

const MintNFT = () => {
  const navigate = useNavigate();
  const editionDropAddress = '0x1220B6309292881FE4b76EF0746bD2ED16aAaac4';
  const { contract: editionDrop } = useContract(
    editionDropAddress,
    'edition-drop',
  );

  const styles = {
    button: {

      backgroundColor: 'white',
      color: 'black',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      marginTop: "20px",
      cursor: 'pointer',
      fontSize: '20px',
    },
  }
  //Render mint nft screen.
  return (
    <div className="mint-nft">
      <h1>Mint your free Voter Membership NFT</h1>

      <div className="btns">
        <div className="btn-hero">
          <Web3Button
            contractAddress={editionDropAddress}
            action={(contract) => {
              contract.erc1155.claim(0, 1);
            }}
            onSuccess={() => {
              console.log(
                `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${editionDrop.getAddress()}/0`,
              );
            }}
            onError={(error) => {
              console.error('Failed to mint NFT', error);
            }}
          >
            Mint your NFT (FREE)
          </Web3Button>

        </div>

        <div className="btn-hero">
          <button style={styles.button} onClick={() => { navigate("/Members") }}>Members</button>
        </div>

      </div>

    </div>
  );
}
export default MintNFT;