// `npm i immer` to install immer
import { produce } from "immer"

export default function Component() {
	const [appState, setAppState] = useState({})

	// Runs once per page load
	useEffect(() => {
		// On page load, fetch the item as a string from localStorage and then parse it to JSON
		const localAppState = JSON.parse(localStorage.getItem("unnamed-app-data"))

		// Update appState with setAppStaet
		setAppState(localAppState)
	}, [])

	useEffect(() => {
		// Whenever appState variable changes, AUTOMATICALLY update our localstorage
		localStorage.setItem("unnamed-app-data", JSON.stringify(appState))
	}, [appState])

	setAppState(produce(draft => {
		draft.currentUser = {
			username: "user1",
			expires: Date.now() + 60 * 60 * 1000 // 1 hour
		}
	}))

	console.log("hello")

	return (
		<>
			{appState.users.length}
		</>
	)
}

