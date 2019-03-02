import React from 'react'
import axios from 'axios'
import moment from 'moment'
import _ from 'lodash'
import { withStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import Avatar from '@material-ui/core/Avatar'

const styles = theme => ({
	button: {
		margin: theme.spacing.unit,
	},
	input: {
		display: 'none',
	},
	card: {
		margin: '0 15px 15px 0',
		width: '400px',
		display: 'inline-block',
		cursor: 'pointer',
	},
	container: {
		margin: '15px',
	},
})

class Movies extends React.Component {
	constructor(props) {
		super(props)
		this.state = { movies: [], currentMovie: undefined }
	}
	componentDidMount() {
		axios
			.get(
				'/api/getMovies?top=50&latest=true&lang=' +
					this.props.language +
					'&rip=' +
					this.props.rip
			)
			.then(response => {
				this.setState({ movies: response.data })
			})
	}

	render() {
		const { classes } = this.props
		return (
			<div className={classes.container}>
				{this.props.currentState === 'eachMovie' &&
					this._getCurrentMovieRips()}
				{this.props.currentState !== 'eachMovie' &&
					this.state.movies.map(item => this._getMovieCard(item))}
			</div>
		)
	}

	_getCurrentMovieRips = () => {
		const { classes } = this.props
		return this.state.currentMovie.map((mov, idx) => {
			return (
				<Card
					className={classes.card}
					key={mov.name + idx}
					onClick={() => this._openLink(mov)}
				>
					<CardHeader
						avatar={
							<Avatar className={classes.avatar}>
								{mov.name.substr(0, 1).toUpperCase()}
							</Avatar>
						}
						title={mov.ripInfo}
						subheader={moment(mov.date).format(
							'DD MMM YYYY HH:mm:ss'
						)}
					/>
				</Card>
			)
		})
	}

	_openLink = mov => {
		window.open(mov.link, '_blank')
	}

	_getMovieCard = movieRips => {
		const { classes } = this.props
		const movie = _.trim(movieRips[0].name)
		return (
			<Card
				className={classes.card}
				key={movie}
				onClick={() => this._setMovie(movieRips)}
			>
				<CardHeader
					avatar={
						<Avatar className={classes.avatar}>
							{movie.substr(0, 1).toUpperCase()}
						</Avatar>
					}
					title={movie}
				/>
			</Card>
		)
	}

	_setMovie = currentMovie => {
		this.setState({ currentMovie })
		this.props.addBreadcrumb(currentMovie[0].name)
	}
}

export default withStyles(styles)(Movies)
