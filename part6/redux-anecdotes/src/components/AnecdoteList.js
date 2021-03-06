import { useSelector, useDispatch } from "react-redux";
import { addVote } from "../reducers/anecdoteReducer";

const AnecdoteList = () => {
  // get state from redux store and sort it by votes
  const anecdotes = useSelector((state) =>
    state.sort((a, b) => b.votes - a.votes)
  );

  // get dispatch function from react-redux
  const dispatch = useDispatch();

  // dispatch the action returned from addVote
  const vote = (id) => {
    console.log("vote", id);
    dispatch(addVote(id));
  };

  return (
    <div>
      {anecdotes.map((anecdote) => (
        <div key={anecdote.id}>
          <div>{anecdote.content}</div>
          <div>
            has {anecdote.votes}
            <button onClick={() => vote(anecdote.id)}>vote</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnecdoteList;
