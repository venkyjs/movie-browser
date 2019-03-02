import React from 'react'
import axios from 'axios'
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

class Rips extends React.Component {
	constructor(props) {
		super(props)
		this.state = { rips: [] }
	}
	componentDidMount() {
		axios.get('/api/getRips?lang=' + this.props.language).then(response => {
			this.setState({ rips: response.data })
		})
	}
	render() {
		const { classes } = this.props
		return (
			<div className={classes.container}>
				{this.state.rips.map(item => {
					return (
						<Card
							className={classes.card}
							key={item.rip}
							onClick={() => this._setRip(item.rip)}
						>
							<CardHeader
								avatar={
									<Avatar className={classes.avatar}>
										{item.avatar}
									</Avatar>
								}
								title={item.name}
								subheader={item.desc}
							/>
						</Card>
					)
				})}
			</div>
		)
	}

	_setRip = rip => {
		this.props.setRip(rip)
	}
}

export default withStyles(styles)(Rips)
