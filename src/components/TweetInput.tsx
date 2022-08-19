import React, { useState } from "react";
import styles from "./TweetInput.module.css";
import { storage, db, auth } from "../firebase";
import firebase from "firebase/app";
import { useSelector } from "react-redux";
import { selectUser } from "../features/userSlice";
import { Avatar, Button, IconButton } from "@material-ui/core";
import AddPhotoAlternateIcon from "@material-ui/icons/AddPhotoAlternate";
function TweetInput() {
  const user = useSelector(selectUser);
  const [tweetMsg, setTweetMsg] = useState("");
  const [images, setImages] = useState<any[]>([]);

  const deleteImage = async (id) => {
    const ret = window.confirm("この画像を削除しますか？");
    if (!ret) {
      return false;
    } else {
      const newImages = images.filter((image) => image.id !== id);
      setImages(newImages);
      return storage.ref("images").child(id).delete();
    }
  };

  const onChangeImageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files![0]) {
      const file = e.target.files![0];
      let blob = new Blob([file], { type: "image/jpeg" });

      // Generate random 16 digits strings
      const S =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const N = 16;
      const fileName = Array.from(crypto.getRandomValues(new Uint32Array(N)))
        .map((n) => S[n % S.length])
        .join("");

      const uploadRef = storage.ref("images").child(fileName);
      const uploadTask = uploadRef.put(blob);

      uploadTask
        .then(() => {
          // Handle successful uploads on complete
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            const newImage = { id: fileName, path: downloadURL };
            setImages((prevState) => [...prevState, newImage]);
          });
        })
        .catch(() => {});
    }
  };
  const sendTweet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images) {
      db.collection("posts").add({
        avatar: user.photoUrl,
        image: images.map((item) => item.path),
        text: tweetMsg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        username: user.displayName,
      });
    } else {
      db.collection("posts").add({
        avatar: user.photoUrl,
        image: [],
        text: tweetMsg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        username: user.displayName,
      });
    }
    setTweetMsg("");
    setImages([]);
  };
  return (
    <>
      <form onSubmit={sendTweet}>
        <div className={styles.tweet_form}>
          <Avatar
            className={styles.tweet_avatar}
            src={user.photoUrl}
            onClick={async () => {
              await auth.signOut();
            }}
          />
          <input
            className={styles.tweet_input}
            placeholder="つぶやく"
            type="text"
            autoFocus
            value={tweetMsg}
            onChange={(e) => setTweetMsg(e.target.value)}
          />
          <IconButton>
            <label>
              <AddPhotoAlternateIcon className={styles.tweet_addIcon} />
              <input
                className={styles.tweet_hiddenIcon}
                type="file"
                accept="image/*"
                onChange={onChangeImageHandler}
              />
            </label>
          </IconButton>
        </div>

        <Button
          type="submit"
          disabled={!tweetMsg}
          className={
            tweetMsg ? styles.tweet_sendBtn : styles.tweet_sendDisableBtn
          }
        >
          投稿
        </Button>
      </form>

      <div className={styles.preview_area}>
        {images?.map((item, i) => {
          return (
            <div
              key={i}
              className={styles.preview_area_image}
              onClick={() => deleteImage(item.id)}
            >
              <img src={item.path} />
            </div>
          );
        })}
      </div>
    </>
  );
}

export default TweetInput;
