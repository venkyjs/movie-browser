import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';

import AppBar from './app-bar';
import Language from './language';
import Rips from './rips';
import Movies from './movies';

import { APP } from '../utils/constants';
import Axios from 'axios';
import moment from 'moment';

const styles = theme => ({
	breadcrumbLast: {
		display: 'inline-block',
		textTransform: 'uppercase',
		padding: '9px 9px',
		fontSize: '0.875em'
	},
	drawerBase: {
		padding: '10px'
	}
});

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = this._getDefaultState();
	}

	componentDidMount() {
		Axios.get('/api/init').then(response => {
			this.setState({ lastUpdated: response.data.lastUpdated });
		});
	}

	render() {
		const { classes } = this.props;
		const { view, language, rip } = this.state;
		return (
			<div>
				<AppBar openMenu={() => this.toggleDrawer('left', true)} />
				{this._getBreadcrumb()}
				{view === APP.VIEW.LANGUAGE && <Language onChange={this._setLanguage} />}
				{view === APP.VIEW.RIP_TYPE && <Rips language={language} setRip={this._setRip} />}
				{view === APP.VIEW.MOVIES && (
					<Movies
						language={language}
						rip={rip}
						addBreadcrumb={this._addCrumb}
						currentState={this.state.movieState}
					/>
				)}
				<Drawer open={this.state.left} onClose={() => this.toggleDrawer('left', false)}>
					<div
						className={classes.drawerBase}
						tabIndex={0}
						role="button"
						onClick={() => this.toggleDrawer('left', false)}
						onKeyDown={() => this.toggleDrawer('left', false)}
					>
						<div className={classes.toolbar} />
						<Divider />
						<div>
							Last Updated: <br />
							{this._getLastUpdated()}
						</div>
					</div>
				</Drawer>
			</div>
		);
	}

	toggleDrawer = (side, open) => {
		this.setState({
			[side]: open
		});
	};

	_getLastUpdated = () => {
		const lu = this.state.lastUpdated;
		if (lu) {
			return moment(lu).format('DD MMM YYYY HH:mm:ss');
		} else {
			return '';
		}
	};

	_addCrumb = title => {
		const path = this.state.path;
		path.push(title);
		this.setState({ path: [...path], movieState: 'eachMovie' });
	};

	_getDefaultState = () => {
		return {
			view: APP.VIEW.LANGUAGE,
			language: undefined,
			path: []
		};
	};

	_getBreadcrumb = () => {
		const { classes } = this.props;
		return (
			<div>
				{this.state.path.map((item, idx) => {
					if (idx < this.state.path.length - 1) {
						return (
							<React.Fragment>
								<Button
									key={idx}
									color="primary"
									className={classes.button}
									onClick={() => this._goTo(item, idx)}
								>
									{item}
								</Button>
								<span className={classes.breadcrumbLast}> &gt; </span>
							</React.Fragment>
						);
					} else {
						return (
							<Typography
								component="span"
								variant="subtitle1"
								color="inherit"
								className={classes.breadcrumbLast}
							>
								{item}
							</Typography>
						);
					}
				})}
			</div>
		);
	};

	_goTo = (item, idx) => {
		switch (idx) {
			case 0:
				const defaultState = this._getDefaultState();
				this.setState({ ...defaultState });
				break;
			case 1:
				this._setLanguage(item);
				break;
			case 2:
				this._setRip(item);
				break;
		}
	};

	_setLanguage = language => {
		this.setState({
			language,
			view: APP.VIEW.RIP_TYPE,
			path: ['Home', language]
		});
	};

	_setRip = rip => {
		const { language } = this.state;
		this.setState({
			rip,
			view: APP.VIEW.MOVIES,
			path: ['Home', language, rip],
			movieState: undefined
		});
	};
}

export default withStyles(styles)(App);
