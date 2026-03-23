import VideoRoom from '../../../components/VideoRoom'

export default async function RoomPage({ params }) {
  const { roomId } = await params
  return <VideoRoom roomId={roomId} />
}