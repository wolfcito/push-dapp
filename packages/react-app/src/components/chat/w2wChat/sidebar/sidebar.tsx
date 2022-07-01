import React, { useState } from 'react';
import SearchBar from '../searchBar/searchBar';
import IntentBar from '../intentBar/intentBar';
import './sidebar.css';
import { Feeds } from '../w2wIndex'
import { Button } from "components/SharedStyling";

const Sidebar = (props: { setChat: (text: Feeds) => void; renderInbox: any }) => {
    const [chatSelected, setChatselected] = useState(true);
    function renderselected() {
        if (chatSelected) {
            return (
                <>
                    <div className='sidebar_search'>
                        <SearchBar setChat={props.setChat} renderInbox={props.renderInbox} />
                    </div>
                </>
            )
        }
        else {
            return (
                <>
                    <div className='sidebar_search'>
                        <IntentBar setChat={props.setChat} />
                    </div>
                </>
            )
        }
    }

    function showChats() {
        setChatselected(true);
    }

    function showIntents() {
        setChatselected(false);
    }

    return (
        <>
            <div className='sidebar_body'>
                {renderselected()}
                <div className='sidebar_bottom'>
                    <Button style={{ color: "black" }} className="sidebar_bottom_button" onClick={showChats}>Chats</Button>
                    <Button style={{ color: "black" }} className="sidebar_bottom_button" onClick={showIntents}>Intents</Button>
                </div>
            </div>
        </>
    );
}

export default Sidebar;