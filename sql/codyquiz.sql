-- phpMyAdmin SQL Dump
-- version 4.6.4
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 22, 2017 at 06:45 PM
-- Server version: 5.5.53-0+deb8u1
-- PHP Version: 5.6.27-0+deb8u1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `codyquiz`
--

-- --------------------------------------------------------

--
-- Table structure for table `identities`
--

CREATE TABLE `identities` (
  `id` int(10) UNSIGNED NOT NULL,
  `connector_source` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `connector_user_id` varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `connector_address` varchar(1024) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `first_seen_on` datetime NOT NULL,
  `last_access_on` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `quiz_id` int(10) UNSIGNED NOT NULL,
  `answer_type` enum('general','number','confirm','choice') DEFAULT 'general',
  `image_path` varchar(128) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `answer` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `choice_json` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_answers`
--

CREATE TABLE `quiz_answers` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `quiz_id` int(10) UNSIGNED NOT NULL,
  `provided_answer` varchar(64) NOT NULL,
  `answered_on` datetime NOT NULL,
  `is_correct` bit(1) NOT NULL DEFAULT b'0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_texts`
--

CREATE TABLE `quiz_texts` (
  `quiz_id` int(10) UNSIGNED NOT NULL,
  `locale` char(2) NOT NULL,
  `text` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `identities`
--
ALTER TABLE `identities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identities_connector_ids` (`connector_source`,`connector_user_id`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`quiz_id`);

--
-- Indexes for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  ADD PRIMARY KEY (`user_id`,`quiz_id`),
  ADD KEY `quiz_answers_quiz` (`quiz_id`);

--
-- Indexes for table `quiz_texts`
--
ALTER TABLE `quiz_texts`
  ADD PRIMARY KEY (`quiz_id`,`locale`) USING BTREE;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `identities`
--
ALTER TABLE `identities`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `quiz_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  ADD CONSTRAINT `quiz_answers_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `quiz_answers_user` FOREIGN KEY (`user_id`) REFERENCES `identities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `quiz_texts`
--
ALTER TABLE `quiz_texts`
  ADD CONSTRAINT `quiz_texts_id` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`) ON DELETE CASCADE ON UPDATE CASCADE;
