import React, { useEffect, useState } from "react";
import { useUser } from "../../../contexts/userContext";
import "./profile.css";
import {
  fetchUserById,
  updateAvatar,
  updateUser,
} from "../../../services/userServer";
import { fetchAllMedia } from "../../../services/messageService";
import { isImageFile, isVideoFile } from "../../../utls/utils";

const Profile = () => {
  const { user, setUser } = useUser();
  const [userData, setUserData] = useState(null);
  const [media, setMedia] = useState([]);

  useEffect(() => {
    const fetchInitials = async () => {
      try {
        const [userResponse, mediaResponse] = await Promise.all([
          fetchUserById(user?.id, user?.token),
          fetchAllMedia(user?.id, user?.token),
        ]);
        console.log(userResponse.data);
        console.log(mediaResponse.data);
        setUserData(userResponse.data);
        setMedia(mediaResponse.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitials();
  }, []);

  const getMedia = (media) => {
    if (isImageFile(media.file_url, media.file_type)) {
      return (
        <img
          src={media.file_url}
          alt="Image"
          className="profile-image profile-media"
          key={media.id}
          onClick={() => window.open(message.file_url, "_blank")}
        />
      );
    }
    if (isVideoFile(media.file_url, media.file_type)) {
      return (
        <video
          controls
          src={media.file_url}
          className="profile-video profile-media"
          key={media.id}
          onClick={() => window.open(media.file_url, "_blank")}
        ></video>
      );
    }
  };

  const handleChange = async (description, name) => {
    try {
      const response = await updateUser(user.id, description, name, user.token);
      console.log(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpdate = async (selectedFile) => {
    if (!selectedFile) return;

    console.log("uploading image");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await updateAvatar(user.id, formData, user.token);
      console.log(response);
      console.log(response.data);
      setUserData((prevData) => ({
        ...prevData,
        avatar: response.data.avatar,
      }));
    } catch (err) {
      console.log("file upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="profile">
      <div className="profile-wrapper">
        <input
          type="file"
          id="user-image-input"
          accept="image/*"
          onChange={(e) => {
            handleFileUpdate(e.target.files[0]);
          }}
          disabled={isUploading}
          style={{ display: "none" }}
        />
        <label htmlFor="user-image-input" className="profile-avatar-label">
          <img
            src={userData?.avatar}
            alt="Avatar"
            className="avatar profile-avatar"
          />
        </label>
        <input
          type="text"
          value={userData?.username ?? ""}
          onChange={(e) => {
            setUserData({ ...userData, username: e.target.value });
            handleChange(userData.description, e.target.value);
          }}
          className="profile-field profile-username"
        />
        <h4 className="profile-email m0">{userData?.email}</h4>
        <h3 className="profile-heading">DESCRIPTION</h3>
        <input
          type="text"
          value={userData?.description ?? ""}
          onChange={(e) => {
            setUserData({ ...userData, description: e.target.value });
            handleChange(e.target.value, userData.username);
          }}
          className="profile-field profile-description"
        />
        <h3 className="profile-heading">MEDIA</h3>
        <div className="profile-media-div">{media.map((m) => getMedia(m))}</div>
      </div>
    </div>
  );
};

export default Profile;
