import { SceneController } from './engine/SceneController'
import { APFamilyRoom } from './rooms/APFamilyRoom'
import { UIOverlay } from './ui/UIOverlay'
import { useStore } from './store/useStore'
import './index.css'

function App() {
  const currentRoom = useStore((state) => state.currentRoom)

  return (
    <>
      <UIOverlay />
      <SceneController>
        {currentRoom === 'ap_family' && <APFamilyRoom />}
      </SceneController>
    </>
  )
}

export default App
