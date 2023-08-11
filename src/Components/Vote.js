import {
  useAddress,
  useNetwork,
  useContract,
  ConnectWallet,
  Web3Button,
  useNFTBalance,
} from "@thirdweb-dev/react";
import { ChainId } from "@thirdweb-dev/sdk";
import React, { useState, useEffect, useMemo } from "react";
import { AddressZero } from "@ethersproject/constants";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const Vote = () => {
  //Use the hooks thirdweb give us.
  const address = useAddress();

  // Initialize our token contract
  const { contract: token } = useContract(
    "0xD8FFEDf5cc9B1480C1eb1FDC4704644Aa7A6ad01",
    "token"
  );
  const { contract: vote } = useContract(
    "0x6908dB59610c11BF57669dD2bFB1CdEEA277A686",
    "vote"
  );

  const editionDropAddress = "0x1220B6309292881FE4b76EF0746bD2ED16aAaac4";
  const { contract: editionDrop } = useContract(
    editionDropAddress,
    "edition-drop"
  );
  const [proposals, setProposals] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const { data: nftBalance } = useNFTBalance(editionDrop, address, "0");

  const hasClaimedNFT = useMemo(() => {
    return nftBalance && nftBalance.gt(0);
  }, [nftBalance]);

  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // A simple call to vote.getAll() to grab the proposals.
    const getAllProposals = async () => {
      try {
        const proposals = await vote.getAll();
        setProposals(proposals);
        console.log("🌈 Proposals:", proposals);
      } catch (error) {
        console.log("failed to get proposals", error);
      }
    };
    getAllProposals();
  }, [hasClaimedNFT, vote]);

  const containerStyle = {
    display: "flex",
    alignItems: "center", // Center vertically
    justifyContent: "center", // Center horizontally
    width: "100vw",
    height: "100vh",
  };

  const styles = {
    button: {
      backgroundColor: "white",
      color: "black",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      marginTop: "20px",
      cursor: "pointer",
      fontSize: "20px",
      marginRight: "1vw",
    },
  };

  return (
    <div className="votepage" style={containerStyle}>
      <h1>Active Proposals</h1>
      <form
        // style={{ marginLeft: "10vw" }}
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();

          //before we do async things, we want to disable the button to prevent double clicks
          setIsVoting(true);

          // lets get the votes from the form for the values
          const votes = proposals.map((proposal) => {
            const voteResult = {
              proposalId: proposal.proposalId,
              //abstain by default
              vote: 2,
            };
            proposal.votes.forEach((vote) => {
              const elem = document.getElementById(
                proposal.proposalId + "-" + vote.type
              );

              if (elem.checked) {
                voteResult.vote = vote.type;
                return;
              }
            });
            return voteResult;
          });

          // first we need to make sure the user delegates their token to vote
          try {
            //we'll check if the wallet still needs to delegate their tokens before they can vote
            const delegation = await token.getDelegationOf(address);
            // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
            if (delegation === AddressZero) {
              //if they haven't delegated their tokens yet, we'll have them delegate them before voting
              await token.delegateTo(address);
            }
            // then we need to vote on the proposals
            try {
              await Promise.all(
                votes.map(async ({ proposalId, vote: _vote }) => {
                  // before voting we first need to check whether the proposal is open for voting
                  // we first need to get the latest state of the proposal
                  const proposal = await vote.get(proposalId);
                  // then we check if the proposal is open for voting (state === 1 means it is open)
                  if (proposal.state === 1) {
                    // if it is open for voting, we'll vote on it
                    return vote.vote(proposalId, _vote);
                  }
                  // if the proposal is not open for voting we just return nothing, letting us continue
                  return;
                })
              );
              try {
                // if any of the propsals are ready to be executed we'll need to execute them
                // a proposal is ready to be executed if it is in state 4
                await Promise.all(
                  votes.map(async ({ proposalId }) => {
                    // we'll first get the latest state of the proposal again, since we may have just voted before
                    const proposal = await vote.get(proposalId);

                    //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                    if (proposal.state === 4) {
                      return vote.execute(proposalId);
                    }
                  })
                );
                // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                setHasVoted(true);
                // and log out a success message
                console.log("successfully voted");
              } catch (err) {
                console.error("failed to execute votes", err);
              }
            } catch (err) {
              console.error("failed to vote", err);
            }
          } catch (err) {
            console.error("failed to delegate tokens");
          } finally {
            // in *either* case we need to set the isVoting state to false to enable the button again
            setIsVoting(false);
          }
        }}
      >
        {proposals.map((proposal) => (
          <div key={proposal.proposalId} className="card">
            <h5>{proposal.description}</h5>
            <div>
              {proposal.votes.map(({ type, label }) => (
                <div key={type}>
                  <input
                    type="radio"
                    id={proposal.proposalId + "-" + type}
                    name={proposal.proposalId}
                    value={type}
                    //default the "abstain" vote to checked
                    defaultChecked={type === 2}
                  />
                  <label htmlFor={proposal.proposalId + "-" + type}>
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          style={styles.button}
          disabled={isVoting || hasVoted}
          type="submit"
        >
          {isVoting
            ? "Voting..."
            : hasVoted
            ? "You Already Voted"
            : "Submit Votes"}
        </button>
        {!hasVoted && (
          <small>
            This will trigger multiple transactions that you will need to sign.
          </small>
        )}
      </form>
    </div>
  );
};
export default Vote;
