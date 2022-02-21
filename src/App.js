import React from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';

// Constants
const BUILDSPACE_TWITTER_HANDLE = '_buildspace';
const PROFILE_TWITTER_HANDLE = 'seba_itokazu';
const BUILDSPACE_TWITTER_LINK = `https://twitter.com/${BUILDSPACE_TWITTER_HANDLE}`;
const PROFILE_TWITTER_LINK = `https://twitter.com/${PROFILE_TWITTER_HANDLE}`;

const App = () => {

  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
            <div className="left">
              <p className="title">🚀 Ibis Name Service</p>
              <p className="subtitle">Your immortal API on the blockchain!</p>
            </div>
					</header>
				</div>

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
}

export default App;
