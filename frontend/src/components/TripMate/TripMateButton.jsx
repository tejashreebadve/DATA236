import { useDispatch } from 'react-redux'
import { openPanel } from '../../store/slices/aiAgentSlice'
import './TripMate.css'

const TripMateButton = () => {
  const dispatch = useDispatch()

  const handleClick = () => {
    dispatch(openPanel())
  }

  return (
    <button
      className="trip-mate-button"
      onClick={handleClick}
      aria-label="Open TripMate AI Assistant"
      title="TripMate - Your AI Travel Assistant"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 16V14L15 9V5C15 3.9 14.1 3 13 3H11C9.9 3 9 3.9 9 5V9L3 14V16L9 15.5V19L7 20.5V22L12 21L17 22V20.5L15 19V15.5L21 16Z"
          fill="currentColor"
        />
      </svg>
      <span className="trip-mate-button-text">TripMate</span>
    </button>
  )
}

export default TripMateButton

